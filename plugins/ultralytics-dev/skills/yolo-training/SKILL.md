---
name: yolo-training
description: This skill should be used when user asks to "improve my mAP", "why is my model overfitting", "my training is diverging", "read my results.csv", "interpret my training curves", "my AP50 is good but AP50-95 is bad", "my recall is low", "how do I pick learning rate", "which augmentations should I use", "should I use a bigger model", "tune hyperparameters", or asks how to train YOLO26 for detection, instance or semantic segmentation, pose, OBB, classification, or depth.
---

# YOLO26 training

Read the run before changing anything. The `results.csv` and confusion matrix usually name the
problem already.

## Order of operations

Ordered by cost to try, cheapest first, not by size of the potential win.

1. **Epochs and schedule.** Undertrained looks like every other problem, and it costs nothing
   but time to rule out.
2. **Augmentation.** The knob for the generalization gap, at no extra compute per epoch.
3. **Loss weights and LR.** Cheap, and the curves usually say which one is wrong.
4. **Model size.** Scale up when train loss is still falling at the end of the schedule and the
   train and val curves sit close together. That is underfitting, and it is the only case a
   bigger model reliably fixes.
5. **Resolution.** Compute scales with the square of `imgsz`, so 640 to 1280 is roughly 4x the
   training budget, and pretrained weights transfer worse the further you move from the size
   they were fit at. Justify it with the object sizes in your data, not as a default first move.
6. **Data**, label quality and class balance. The highest ceiling and the slowest to move. The
   package ships no dataset-analysis tooling, so any audit here is your own script plus looking
   at images. Worth it once the cheap knobs are spent.

## Diagnostic loop

```python
import pandas as pd

df = pd.read_csv("runs/detect/train/results.csv")
df.columns = df.columns.str.strip()
print(df.tail(10)[["epoch", "train/box_loss", "val/box_loss", "metrics/mAP50(B)", "metrics/mAP50-95(B)"]])
print("best epoch:", df["metrics/mAP50-95(B)"].idxmax(), "of", len(df))
```

Then read, in this order:

| Read                                       | Question it answers                       |
| ------------------------------------------ | ----------------------------------------- |
| best epoch vs total epochs                 | undertrained, overtrained, or right       |
| train loss vs val loss trend               | which side of the generalization gap      |
| mAP50 vs mAP50-95                          | classification and recall vs localization |
| P vs R at the operating point              | over-suppression vs over-firing           |
| per-class AP spread                        | one broken class or a general weakness    |
| confusion matrix background row and column | false positives vs missed detections      |

`references/diagnostics.md` maps each pattern to a cause and a knob, and lists what to rule
out before turning that knob. Read it before recommending a change.
`references/task-notes.md` covers detect, segment, semantic, pose, obb, classify, and depth
specifics.

## Defaults that will surprise you

These produce "I changed X and nothing happened". All six are current defaults.

1. **`optimizer=auto` ignores `lr0` and `momentum`.** It is the default. It picks `MuSGD` at
   lr 0.01 when `ceil(len(dataset) / max(batch, nbs)) * epochs` exceeds 10000, otherwise `AdamW`
   at `0.002 * 5 / (4 + nc)`, and forces `warmup_bias_lr=0`. Crossing that iteration count
   silently changes optimizer between two runs you meant to compare. Setting `lr0` while leaving
   `optimizer=auto` does nothing. Set `optimizer=AdamW` or `optimizer=SGD` explicitly first.
2. **`nbs=64` normalizes the loss, so batch does not scale LR the way you assume.** Below 64 the
   trainer accumulates gradients to an effective 64. Dropping batch 64 to 16 changes almost
   nothing about the effective step.
3. **`close_mosaic=10` turns off mosaic for the last 10 epochs.** The late jump in mAP is that
   switch, not convergence. On a 20-epoch run it is half the schedule, and on a 10-epoch run
   mosaic never runs at all.
4. **Fitness for detect is mAP50-95 alone**, weights `[0, 0, 0, 1]`. `best.pt` and `patience`
   ignore precision, recall, and mAP50 completely. Segment and pose sum both heads, classify
   uses `(top1 + top5) / 2`, semantic uses mIoU. A run whose precision is climbing while
   mAP50-95 is flat will still early-stop.
5. **`max_det=300`** truncates validation on dense scenes. Above roughly 300 objects per image
   your recall ceiling is an artifact.
6. **YOLO26 `end2end` models decode without NMS**, so `iou` does nothing on them. `agnostic_nms`
   still applies, the predictor passes it into the head, so only the IoU threshold is dead.

## Starting recipe

Fine-tuning a pretrained checkpoint on a normal custom dataset:

```bash
yolo train model=yolo26s.pt data=my-data.yaml epochs=200 imgsz=640 batch=16 \
  optimizer=AdamW lr0=0.001 lrf=0.01 cos_lr=True warmup_epochs=3 \
  patience=50 close_mosaic=20
```

Deviate on evidence from the charts, one axis at a time. It differs from the shipped defaults
because `epochs=100` is short for a small dataset, `patience=100` never fires inside 100 epochs,
and `close_mosaic=10` is too short a clean tail once epochs rise.

Change one thing per run and keep `seed` fixed. Run-to-run noise on a small dataset is often
0.5 to 1.0 mAP, so a 0.3 mAP "improvement" from a single run is not a result. Confirm anything
under about 1 point across three seeds.
