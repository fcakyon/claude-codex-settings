# Platform recipes

Working code for each flow. All snippets assume `ULTRALYTICS_API_KEY` is exported.

Recipes 1, 5, and 8 were run end to end against the live API on 2026-08-04. The rest come from
`/openapi.json` and were not executed, since 3, 6, and 7 create billable resources. Their
request shapes are correct, their responses unconfirmed.

## Shared client

```python
import json
import os
import urllib.request

KEY, BASE = os.environ["ULTRALYTICS_API_KEY"], "https://platform.ultralytics.com"


def api(method, path, body=None):
    """Call the platform API and return the parsed JSON response."""
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read().decode())
```

`requests` works the same way and is already an ultralytics dependency.

## 1. Upload a finished local run

Turns `runs/detect/train/` into a platform model with training curves, final metrics,
resolved args, and downloadable weights.

```python
import csv
import pathlib
import urllib.request

import yaml

run = pathlib.Path("runs/detect/train")

# results.csv column -> the closed metrics key set
FINAL = {
    "metrics/mAP50(B)": "mAP50",
    "metrics/mAP50-95(B)": "mAP50-95",
    "metrics/precision(B)": "precision",
    "metrics/recall(B)": "recall",
    "metrics/accuracy_top1": "accuracy_top1",
    "metrics/accuracy_top5": "accuracy_top5",
    "metrics/mIoU": "miou",
    "metrics/pixel_acc": "pixel_acc",
    "metrics/delta1": "delta1",
    "metrics/abs_rel": "abs_rel",
    "metrics/rmse": "rmse",
    "metrics/silog": "silog",
}

rows = [{k.strip(): v for k, v in r.items()} for r in csv.DictReader((run / "results.csv").open())]
train_args = yaml.safe_load((run / "args.yaml").read_text())

# Per-epoch curves. Keys here are free-form, so raw csv names go straight in.
# Drop `time`, it is wall-clock seconds and would ship as a chart series.
train_results = [
    {
        "epoch": int(float(r["epoch"])),
        "metrics": {k: float(v) for k, v in r.items() if k not in {"epoch", "time"} and v not in ("", None)},
    }
    for r in rows
]

# Final metrics, taken from the best epoch. Keys must be renamed or the request 400s.
best = max(train_results, key=lambda r: r["metrics"].get("metrics/mAP50-95(B)", 0.0))["metrics"]
metrics = {v: best[k] for k, v in FINAL.items() if k in best}

# The project must exist first, and POST /api/models needs its ID, not its slug.
project_id = api("POST", "/api/projects", {"slug": "my-project", "name": "My Project"})["projectId"]

model_id = api(
    "POST",
    "/api/models",
    {
        "projectId": project_id,
        "slug": "yolo26n-run1",
        "name": "yolo26n run1",
        "task": train_args.get("task", "detect"),
        "epochs": len(rows),
        "trainArgs": {k: str(v) for k, v in train_args.items()},
        "trainResults": train_results,
        "metrics": metrics,
    },
)["modelId"]

# Weights: signed URL, bare PUT, then complete. All three calls are required.
weights = run / "weights" / "best.pt"
signed = api(
    "POST",
    "/api/upload/signed-url",
    {
        "assetType": "models",
        "assetId": model_id,
        "filename": "best.pt",
        "contentType": "application/octet-stream",
        "totalBytes": weights.stat().st_size,
    },
)
urllib.request.urlopen(
    urllib.request.Request(
        signed["uploadUrl"],
        data=weights.read_bytes(),
        method="PUT",
        headers={"Content-Type": "application/octet-stream"},  # no Authorization here
    )
)
api("POST", "/api/upload/complete", {"sessionId": signed["sessionId"]})
```

Verify with `GET /api/models/{model_id}/files`. The file is served under the model slug
(`yolo26n-run1.pt`) regardless of the `filename` you uploaded.

`results.csv` numbers epochs from 1, the callback in recipe 2 sends `trainer.epoch` from 0.
Charts from a retro upload and a streamed run are offset by one against each other.

For a large `best.pt`, stream the PUT instead of `read_bytes()`, or reuse
`ultralytics.utils.uploads.safe_upload(file=..., url=..., retry=3, progress=True)`,
which adds retries and a progress bar.

The plot PNGs do not transfer, only the per-epoch curves in `trainResults`. Use recipe 2 instead
if the charts matter.

## 2. Track a run that has not started

```bash
export ULTRALYTICS_API_KEY=ul_...
yolo train model=yolo26n.pt data=my-data.yaml epochs=100 project=my-project name=run1
```

It prints `Platform: Streaming training metrics to Platform` at startup and a model URL at the
end. Enablement gate, all must hold:

1. `RANK` in `{-1, 0}` and not the DDP launcher process, so under DDP only rank 0 reports.
2. Not running under pytest.
3. `trainer.args.project` is truthy, checked again in every callback.
4. A key from `ULTRALYTICS_API_KEY` or `settings.json`. There is no separate on/off setting, the
   key and `project=` are the whole switch.

All traffic goes to one endpoint, `POST /api/webhooks/training/metrics`. A `401` clears the
cached key and stops tracking for the rest of the process, while `403` and `404` fail only the
one request. Every one of them logs a warning.

Diagnosing silence:

| Symptom                                    | Cause                                                      |
| ------------------------------------------ | ---------------------------------------------------------- |
| No `Platform:` line at all                 | no key, or `project=` unset                                |
| `Training will not be tracked on Platform` | key present, server rejected `training_started`            |
| Run appears, no weights                    | `best.pt` upload failed, warning is in the console log     |
| Name is `train-2` not `train`              | server auto-incremented a taken slug, it logs the real one |
| Streams for a while, then stops            | a `401` cleared the key, the warning is in the console log |

Checkpoints upload at most every 15 minutes mid-run, then `best.pt` uploads blocking at the end.
Project and name are slugified, so `My Run 1` becomes `my-run-1`.

## 3. Upload a dataset

Local archive, four calls:

```python
ds = api(
    "POST",
    "/api/datasets",
    {
        "slug": "my-dataset",
        "name": "My Dataset",
        "task": "detect",
        "format": "yolo",
        "imageCount": 1200,
        "visibility": "private",
    },
)["datasetId"]

archive = pathlib.Path("my-dataset.zip")
signed = api(
    "POST",
    "/api/upload/signed-url",
    {
        "assetType": "datasets",
        "assetId": ds,
        "filename": archive.name,
        "contentType": "application/zip",
        "totalBytes": archive.stat().st_size,
    },
)
# PUT the bytes then POST /api/upload/complete as in recipe 1, streaming rather than
# read_bytes() since dataset archives are large.
job = api("POST", "/api/datasets/ingest", {"datasetId": ds, "sessionId": signed["sessionId"]})
```

Remote archive, no upload at all:

```python
api("POST", "/api/datasets/ingest", {"datasetId": ds, "sourceUrl": "https://example.com/data.zip"})
```

Accepted archives: ZIP, TAR, TAR.GZ, TGZ, NDJSON. The archive should carry the standard
`images/{split}` + `labels/{split}` layout, or pass `targetSplit` to force every incoming image
into one split. Ingest is async, poll `GET /api/datasets/{id}` until `status` leaves `processing`.

Adding to an existing dataset uses the same calls with `conflictPolicy` set to
`skip`, `keep_both`, or `replace`.

## 4. Download a dataset

Fastest path, let the package do it:

```python
YOLO("yolo26n.pt").train(data="ul://username/datasets/my-dataset", epochs=100)
```

`resolve_platform_uri` and `check_file`, both in `ultralytics/utils/checks.py`, turn the URI into
a signed URL and download it, then `convert_ndjson_to_yolo_if_needed` in
`ultralytics/data/utils.py` converts the NDJSON on the fly.

To materialize it on disk:

```python
import asyncio

from ultralytics.data.converter import convert_ndjson_to_yolo

url = api("GET", "/api/datasets/my-dataset/export")["downloadUrl"]
urllib.request.urlretrieve(url, "my-dataset.ndjson")
data_yaml = asyncio.run(convert_ndjson_to_yolo("my-dataset.ndjson", output_path="datasets/"))
```

`convert_ndjson_to_yolo` is async and downloads images concurrently. It returns the `data.yaml`
path for detect, segment, pose, and obb, and the dataset directory for classify.

Pin a snapshot before a training campaign so the dataset cannot shift underneath the runs:

```python
v = api("POST", "/api/datasets/my-dataset/export", {"description": "v1 baseline"})
# later: api("GET", f"/api/datasets/my-dataset/export?v={v['version']}")
```

## 5. Search datasets

```python
r = api("GET", "/api/explore/search?q=weld+defect&type=datasets&task=detect&sort=stars")
for d in r["datasets"]:
    print(f"ul://{d['username']}/datasets/{d['slug']}  {d['imageCount']} imgs  {d['classCount']} cls")
```

Returned `slug` plus `username` compose the `ul://` URI directly, so a search result is
immediately trainable. `hasMore` drives pagination through `offset`.
`GET /api/datasets?username=someone` lists one user's public datasets instead.

## 6. Start cloud training

```python
print(api("GET", "/api/training/gpu-availability"))  # what is free right now

model_id = api(
    "POST", "/api/models", {"projectId": project_id, "slug": "cloud-run1", "name": "cloud run1", "task": "detect"}
)["modelId"]

job = api(
    "POST",
    "/api/training/start",
    {
        "modelId": model_id,
        "projectId": project_id,
        "gpuType": "rtx-4090",
        "trainArgs": {
            "model": "yolo26n.pt",
            "data": "ul://username/datasets/my-dataset",
            "epochs": 100,
            "imgsz": 640,
            "batch": 16,
        },
    },
)
print(job["billing"]["estimatedCostDisplay"])
```

Poll with
`GET /api/models/{modelId}/training`, cancel with `DELETE /api/models/{modelId}/training`.

## 7. Export and deploy

```python
exp = api(
    "POST",
    "/api/exports",
    {"modelId": model_id, "format": "engine", "gpuType": "rtx-4090", "args": {"imgsz": 640, "quantize": 16}},
)
# poll api("GET", f"/api/exports/{exp['exportId']}") until it reports complete

dep = api(
    "POST",
    "/api/deployments",
    {
        "modelId": model_id,
        "name": "prod-endpoint",
        "region": "europe-west1",
        "resources": {"cpu": 2, "memoryGi": 4, "minInstances": 0, "maxInstances": 3},
    },
)
```

TensorRT (`engine`) exports require `gpuType` because the plan is GPU-specific.
`minInstances: 0` scales to zero and trades cold-start latency for cost.
Both endpoints spend credits, confirm with the user first.

## 8. Cleanup

```python
api("DELETE", f"/api/projects/{project_id}")  # soft, cascades to the project's models
api("DELETE", "/api/trash/empty")  # permanent
```

`DELETE /api/projects/{id}` returns `cascadedModels`. `DELETE /api/trash/empty` returns a
per-type deleted count. Ask the user before running either.
