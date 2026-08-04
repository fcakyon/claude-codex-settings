# Reading a run

Symptom, the cheap knob, and what to check when the knob does not move it. Compute and
relabeling are the fallback, not the opener.

## Schedule patterns

| Best epoch lands at          | Meaning                          | Action                             |
| ---------------------------- | -------------------------------- | ---------------------------------- |
| final epoch                  | undertrained                     | more epochs, 1.5x to 2x            |
| 80 to 95 percent through     | about right                      | leave it                           |
| 40 to 60 percent, then decay | overtrained                      | more augmentation, or stop earlier |
| under 25 percent             | LR too high, or the data is tiny | lower `lr0`, add regularization    |

`patience=100` against `epochs=100` means early stopping never fires. Set `patience` to roughly
a quarter of `epochs` when you want it to be real.

## Metric-shape patterns

### mAP50 high, mAP50-95 low

Classification and coarse localization work. Tight localization does not.

Start with the loss weights. Cheap, and aimed at the symptom:

```bash
box=10.0 dfl=2.0 # from 7.5 / 1.5
```

Raise `box` and `dfl` together, roughly 1.3x to 2x. YOLO26 sets `reg_max: 1`, which switches the
distribution focal loss off, so `dfl` weights a plain L1 term on the box edges and the
results.csv column is `train/l1_loss`, not `train/dfl_loss`. The knob still works, and it is
still the more targeted of the two. Watch that `cls` does not get crowded out, a collapsing
`metrics/precision(B)` means you went too far.

If that moves nothing, the ceiling is probably not the loss:

1. **Loose ground truth.** Sloppy boxes cap mAP50-95 permanently and no loss weight recovers
   it. Overlay 30 to 50 GT boxes on their images and look. If human boxes sit 5 to 10 pixels
   outside the object, the ceiling is the labels and the only fix is relabeling.
2. **Ambiguous class boundaries.** "Where does the scratch end" has no tight answer, and
   annotators disagree with each other. Check inter-annotator spread before blaming the model.
3. **Objects too small for the resolution.** An object spanning 12 pixels cannot be localized
   to mAP50-95 precision at any loss weight. Read the Small objects section for what raising
   `imgsz` costs before reaching for it.

### Precision high, recall low

The model fires rarely and is right when it does. It is missing objects.

Rule out first:

1. **Missing annotations.** Unlabeled true objects train the model to suppress them, and then
   penalize it again at validation. Look at the highest-confidence false positives. If they are
   correct detections of unlabeled objects, the dataset is the bug.
2. **`conf` at inference.** Validation uses `conf=0.001`, prediction defaults to `0.25`. A
   recall complaint from `predict` output and one from `val` metrics are different problems.
3. **`max_det=300`** on dense scenes.
4. **Small objects** below the P3 stride, see the small-object section.

Then:

```bash
cls=1.0    # from 0.5, push classification confidence up
cls_pw=0.5 # inverse-frequency class weighting if rare classes carry the loss
```

`cls_pw` is the underused one. `0.0` disables it, `1.0` is full inverse frequency, and values
between dampen it. On a dataset with a 50:1 class ratio, `0.3` to `0.5` often moves rare-class
recall several points where nothing else does. The trainer asserts `0 <= cls_pw <= 1`, so
values above 1 raise rather than weight harder.

### Precision low, recall high

The model fires often, including on nothing.

Rule out first:

1. **Duplicate boxes.** Look at raw predictions. Many overlapping boxes on one object means
   NMS, not the model. Lower `iou` from `0.7` toward `0.5`. On YOLO26 `end2end` this knob does
   nothing, the model decodes without NMS.
2. **Background false positives.** Read the confusion matrix background column. If one class
   dominates it, that class needs hard negatives.
3. **Class confusion.** Off-diagonal mass between two classes means the taxonomy is the
   problem, not the threshold. Merging two classes that annotators cannot separate reliably
   often beats any amount of tuning.

Then add background-only images (5 to 10 percent of the train set, no label file), and raise
inference `conf`.

### Both precision and recall low across every class

Undertrained, wrong LR, or broken data loading. Check that training loss is still falling. If
the first-epoch mAP is near zero and stays there, verify the label format and `nc` before
touching hyperparameters.

### One class far below the others

Per-class AP spread is data, not hyperparameters, nine times out of ten. Check instance count,
then look at 20 of its images. A class with 40 instances against classes with 4000 will
underperform regardless of the recipe. Options, in order: collect more, merge it into a
neighbor class, or apply `cls_pw`.

### mAP50-95 close to mAP50

Unusual, and normally means objects are large and easy. Little headroom on localization.
Look at recall and per-class AP instead.

## Loss-curve patterns

### Train loss falls, val loss rises

Overfitting. The gap opens, and mAP50-95 peaks then decays.

Augmentation, strongest first:

```bash
mixup=0.15 copy_paste=0.3 scale=0.9 degrees=10 mosaic=1.0 close_mosaic=20
```

- `mixup` blends two images and their labels. The general-purpose regularizer, and the first
  thing to reach for. `0.1` to `0.2` on small datasets.
- `copy_paste` pastes instances between images. It returns the labels untouched when they carry
  no segments, so on a box-only detect dataset it is a silent no-op, not a weak effect. Where
  masks exist it is the strongest single knob for rare-class recall.
- `scale` is the most underrated. `0.5` means 0.5x to 1.5x. Raising to `0.9` widens the
  scale range the model must handle, and it costs nothing at inference.
- `erasing` (classify) and `cutmix` are alternatives when mixup is already maxed.

Then regularization: `weight_decay=0.001` from `0.0005`, and `dropout` for classify only.

Then, if it persists: fewer epochs, a smaller model, more data.

Do not raise `degrees`, `flipud`, or `perspective` without checking that the transform is
valid for your domain. Rotating an X-ray 15 degrees is fine. Rotating a document or a road
scene is not, and it costs accuracy.

### Train and val loss both plateau early, mAP flat

Underfitting or the LR is too low. Confirm the LR actually applied (`optimizer=auto` overrides
it), then raise `lr0` roughly 3x, extend epochs, or reduce augmentation. Heavy `mixup` plus
heavy `mosaic` on a small model genuinely prevents convergence.

### Loss spikes to NaN or explodes

Diverging.

1. Check AMP first. `amp=False` isolates fp16 overflow, which is the usual cause on custom
   architectures and unusual input statistics.
2. Then LR: drop `lr0` 10x.
3. Then warmup: raise `warmup_epochs` to 5, and confirm `warmup_bias_lr` is not the source.
   `optimizer=auto` sets it to 0, an explicit optimizer leaves it at `0.1`.
4. Check labels for out-of-range coordinates. Normalized values above 1.0 produce inf loss.

Gradient clipping is not a knob. `trainer.py` calls `clip_grad_norm_` with a hardcoded
`max_norm=10.0` and exposes no argument, so a run that still explodes needs the LR or the data
fixed, not a tighter clip.

### mAP jumps sharply in the last N epochs

That is `close_mosaic` disabling mosaic, not convergence. Expected. If the jump is large, the
model was fighting mosaic the whole run, and a longer clean tail (`close_mosaic=20` or `30`)
or `mosaic=0.5` will do better.

### Val metrics oscillate hard between epochs

Small val split, or LR too high late in the schedule. Set `cos_lr=True` and `lrf=0.01` so the
LR actually decays to near zero, and check the val split has at least a few hundred instances
per class. Below that, epoch-to-epoch swings are sampling noise and reading them is a mistake.

## Learning rate

`lr0` is the initial LR, `lrf` is a fraction, so the final LR is `lr0 * lrf`. Default `lrf=0.01`
decays to 1 percent.

| Situation                                    | lr0          |
| -------------------------------------------- | ------------ |
| AdamW fine-tune from a pretrained checkpoint | 0.001        |
| AdamW, small dataset under about 1000 images | 0.0005       |
| SGD from scratch                             | 0.01         |
| Diverging                                    | current / 10 |
| Flat loss, confirmed the value applied       | current \* 3 |

The default schedule is linear, `(1 - x/epochs) * (1 - lrf) + lrf`. `cos_lr=True` swaps in a
one-cycle cosine and beats it on most fine-tunes. `warmup_epochs=3` is right for most runs,
raise to 5 for large batches or an unstable start, and drop toward 1 on runs under 30 epochs
where 3 epochs of warmup is 10 percent of the budget. It is clamped to `epochs - 1`, so a
10-epoch smoke test with the default spends 3 of its 10 epochs warming up.

There is no per-group LR argument. To protect a pretrained backbone from a randomly initialized
head, `freeze` it for the first run, or lower `lr0` for the whole model. A discriminative LR
needs a callback that rewrites `optimizer.param_groups`.

## Batch size

Set it to fill the GPU, not to tune accuracy. `nbs=64` normalization means small batches get
gradient accumulation, so batch mostly buys throughput.

- `batch=-1` or a float like `batch=0.8` uses AutoBatch to fill a memory fraction, `-1` targeting
  60 percent.
- Above 64, the effective LR does rise, so scale `lr0` roughly linearly.
- Weight decay is rescaled the same way, `weight_decay * batch * accumulate / nbs`. At
  `batch=128` your `0.0005` is really `0.001`, which is a common unexplained regularization
  change when someone moves a recipe to a bigger GPU.
- Very small batches (under 8) make BatchNorm statistics noisy, a real accuracy cost.

## Small objects

Confirm the problem is real before spending anything on it. Nothing in the package reports box
sizes, so measure them yourself: read the label files, multiply the normalized width and height
by your training `imgsz`, and look at the distribution. Under roughly 32 pixels is the small
regime, under 16 is the hard regime. If most boxes are above that, the ceiling is elsewhere.

Free first:

1. `multi_scale=0.5` trains across a scale range and helps generalization across sizes.
2. `scale=0.9` widens the augmentation scale range.
3. A P2 head variant if objects sit below the P3 stride of 8 pixels.

Then the expensive ones:

4. Tile large images into overlapping crops for training and inference. More images per epoch,
   but each stays at the resolution the pretrained weights expect, which is usually the better
   trade for 4K imagery with 20-pixel objects.
5. Raise `imgsz`. It works, and it is last because of the quadratic cost. Budget for a longer
   schedule rather than swapping `imgsz` into an otherwise unchanged recipe.

## Class imbalance

1. `cls_pw` in `0.3` to `0.5`, see Precision high, recall low for what the power does.
2. `copy_paste` to synthesize rare-class instances, and only if the labels carry segments.
3. Oversample rare-class images by duplicating their paths in the train list. Crude, effective.
4. Merge classes that annotators confuse anyway.

Report per-class AP, never only the macro mAP. A macro number hides a class at 0.05.

## Transfer learning

- `pretrained=True` uses the shipped COCO weights. Always start there, from-scratch training on
  a custom dataset is almost never right.
- `cls_remap=True` (default) matches pretrained classification-head rows by class name, so
  shared names like `person` keep their learned weights across datasets.
- `freeze=N` freezes model indices `0` to `N-1`. On YOLO26 the backbone ends at C2PSA, index 10,
  and the head starts at 11, so `freeze=11` is the whole backbone and the widely copied
  `freeze=10` leaves C2PSA trainable. Useful for a tiny dataset (under about 500 images) or a
  first sanity run. Unfreeze for the real run, a frozen backbone gives up several points once
  the dataset is large enough to move it.
- Domain distance decides how much you fine-tune. Medical, thermal, and satellite imagery share
  little with COCO, so they need more epochs and a higher `lr0` than a natural-image dataset.

## Automated tuning

```python
model.tune(data="my-data.yaml", epochs=30, iterations=300, optimizer="AdamW", plots=False, save=False)
```

Worth running only after the manual passes above are exhausted, and only on a dataset large
enough that a 0.5 mAP difference is signal. It costs `iterations` full trainings. Use a reduced
`epochs` per iteration, then retrain the winner at full length.

## Reporting a change

- State the delta and the baseline: "mAP50-95 0.412 to 0.437, +2.5 points, one seed".
- Name what else changed. A recipe with three simultaneous edits attributes nothing.
- Compare at the same epoch count and the same `imgsz`. Different budgets are not comparable.
