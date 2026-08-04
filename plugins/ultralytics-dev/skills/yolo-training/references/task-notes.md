# Per-task notes

What differs by task. Everything in `diagnostics.md` still applies on top of this.

## Detection

Loss gains: `box=7.5`, `cls=0.5`, `dfl=1.5`. Fitness is mAP50-95 alone.

- YOLO26 `end2end` heads train two branches at once, `0.8 * one2many + 0.2 * one2one`, and decay
  the one2many weight to `0.1` across the schedule. Only the one2one losses reach `results.csv`,
  so the logged box loss is not the whole objective and comparing it against a non-end2end run
  compares different quantities.
- `single_cls=True` collapses every class into one. The fastest way to answer "is this a
  localization problem or a classification problem", run it and compare mAP50-95. A large jump
  means the boxes were never the issue.
- `rect=True` batches by aspect ratio instead of padding to square. Faster and slightly better
  on consistently non-square imagery, incompatible with shuffling so it interacts with mosaic.

## Instance segmentation

Adds `overlap_mask=True` and `mask_ratio=4`. Fitness sums the mask and box components, so both
heads gate early stopping.

- `mask_ratio=4` downsamples masks 4x during training. Drop to `1` or `2` when objects are thin
  or small, since a 20-pixel object becomes 5 pixels of mask at the default and loses its shape.
  It costs memory.
- `overlap_mask=True` merges instances into one mask per image. Set `False` when instances
  overlap heavily and you need them separated during training.
- `copy_paste` only does anything here. The augmentation returns early when the labels carry no
  segments, so it is live on segment datasets and a no-op on box-only detect ones.
  `copy_paste=0.3` with `copy_paste_mode=flip` is a reasonable start.
- Mask AP trailing box AP by a lot means polygon quality. Coarse polygons (4 to 6 points around
  a curved object) cap mask AP no matter what you train.
- `retina_masks=True` at inference only, higher-resolution masks at some cost.

## Semantic segmentation

Fitness is mIoU. Loss is cross-entropy with `ignore_index=255`, so 255 is the void label.

- `cls_pw` applies ENet inverse-log weighting, `(1 / ln(1.02 + p)) ** cls_pw`, not the
  inverse-frequency form detection uses. It is the main knob for classes that occupy few
  pixels, which in semantic segmentation is most of the interesting ones.
- mIoU is a mean over classes, so one collapsed class costs a full share regardless of its
  pixel count. Always print per-class IoU.
- Binary (`nc=1`) uses BCE and ignores class weighting by design.
- Resolution binds harder than in detection, since thin structures below a few pixels wide
  cannot survive the encoder stride. Measure their width before paying the quadratic cost.

## Pose

Loss gains: `pose=12.0`, `kobj=1.0`, `rle=1.0`. Fitness sums pose and box.

- **`flip_idx` in `data.yaml` is required for any flip augmentation.** Without it the trainer
  sets both `fliplr` and `flipud` to 0 and logs a warning, so pose runs quietly lose their
  cheapest augmentation. `flip_idx` is the permutation that swaps left and right keypoints, and
  a wrong one is worse than none because it trains mirrored labels.
- `kpt_shape: [N, 3]` means x, y, visibility. `[N, 2]` means no visibility flag, and then
  occluded keypoints cannot be marked, which distorts the loss.
- Keypoint accuracy far behind box accuracy often means resolution, since keypoints need more
  pixels on target than boxes do. Try `scale` and a longer schedule first, raising `imgsz` is
  the expensive answer.
- Raise `pose` above 12.0 only after confirming boxes are already good, the two compete.

## Oriented bounding boxes

Adds `angle=1.0`.

- `degrees` is the augmentation that matters, and unlike axis-aligned detection it is safe.
  Aerial and document imagery have no canonical up, so `degrees=180` is reasonable.
- `flipud=0.5` is equally valid for aerial imagery and off by default.
- Angle-periodicity errors show as a class of predictions rotated 90 or 180 degrees from the
  target. Check the label convention before raising `angle`, a systematic offset is a data bug.
- Objects with near-square aspect ratio have poorly defined angles and will always score worse.
  Exclude them from the analysis rather than tuning against them.
- OBB validation runs at `conf=0.01`, the other tasks at `0.001`. OBB mAP is measured on a
  smaller candidate pool, so it is not directly comparable to an axis-aligned number.

## Classification

Fitness is `(top1 + top5) / 2`. Different augmentation set from the detection tasks.

- `auto_augment` accepts `randaugment` (default), `autoaugment`, `augmix`. `randaugment` is the
  right default. Set it empty for small fine-grained datasets where the transforms destroy the
  distinguishing detail.
- `erasing=0.4` is random erasing, the classification analogue of cutout, and the main
  overfitting knob alongside `mixup` and `cutmix`.
- `dropout` applies to the classification head only, and is 0 by default. `0.1` to `0.2` for a
  small dataset.
- Mosaic, mixup ratios, and the box augmentations do not apply.
- Top-1 far below top-5 means confusable classes, not general weakness. Read the confusion
  matrix and consider merging.
- Class imbalance shows in top-1 immediately. Balance the sampler or the dataset, `cls_pw` is
  not wired into the classification loss.

## Depth

Loss gains: `dlog=1.0` (SILog), `dgrad=0.5` (gradient), `dlam=1.0`. Fitness is `delta1`.

- `dlam=1.0` is fully scale-invariant, `0.0` is plain log-RMSE. Lower it when absolute depth
  matters rather than relative structure.
- `dgrad` sharpens depth discontinuities at object boundaries. Raise it when edges look smeared.
- Reported metrics are `delta1`, `abs_rel`, `rmse`, `silog`. Only `delta1` is higher-is-better.
