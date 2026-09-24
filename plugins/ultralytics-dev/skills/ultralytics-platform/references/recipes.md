# Platform recipes

These examples assume the SDK and authentication setup in [SKILL.md](../SKILL.md).

## Confirm the workspace and resource

```python
from ultralytics_platform import Platform

owner, dataset_name = "my-workspace", "my-dataset"

with Platform() as client:
    account = client.account.summary()
    dataset = client.datasets.retrieve(owner, dataset_name)["dataset"]

print(account["username"], dataset["status"], dataset["splits"])
```

Use a key created in the target workspace. Before a mutation, verify the owner, URL name, status,
and any fields the request will change. Read the resource again after the mutation.

## Track a new run

```bash
uv pip install -U "ultralytics>=8.4.120"
yolo login YOUR_API_KEY
yolo train model=yolo26n.pt data=coco8.yaml epochs=100 project=owner/project name=run1
```

At startup, expect `Platform: Streaming training metrics to Platform`. No line means the key or
`project=` is missing. A `401` clears the cached key for that process. The callback uploads metrics,
plots, console and system data, and final weights.

## Upload a finished run

Create the project and model record, then upload `best.pt`. `trainResults` carries per-epoch numeric
metrics. Top-level `metrics` is optional and limited to `mAP50`, `mAP50-95`, `precision`, `recall`,
`accuracy_top1`, `accuracy_top5`, `miou`, `pixel_acc`, `delta1`, `abs_rel`, `rmse`, and `silog`.

```python
from ultralytics_platform import Platform

owner, project, model_name = "my-workspace", "my-project", "run1"
train_results = [{"epoch": 1, "metrics": {"metrics/mAP50-95(B)": 0.42}}]

with Platform() as client:
    created_project = client.projects.create(project=project, name="My Project", owner=owner)
    model = client.models.create(
        body={
            "owner": created_project["owner"],
            "project": created_project["project"],
            "model": model_name,
            "task": "detect",
            "epochs": len(train_results),
            "trainResults": train_results,
            "metrics": {"mAP50-95": 0.42},
        }
    )
```

Upload `best.pt` with the signed upload sequence below, using `assetType="models"`,
`assetId=model["id"]`, and `contentType="application/octet-stream"`. Stop after
`client.upload.complete`, then verify `client.models.files(model["owner"], model["project"],
model["model"])["files"]`. Create calls can auto-suffix names, so use the returned names.

## Upload a dataset

The archive must be ZIP, TAR, TAR.GZ, TGZ, or NDJSON. Loose images need an archive first.

```python
from pathlib import Path

import httpx
from ultralytics_platform import Platform

owner, dataset_name = "my-workspace", "my-dataset"
archive = Path("my-dataset.zip")

with Platform() as client:
    dataset = client.datasets.create(dataset=dataset_name, name="My Dataset", owner=owner, task="detect")
    signed = client.upload.signed_url(
        body={
            "assetType": "datasets",
            "assetId": dataset["id"],
            "filename": archive.name,
            "contentType": "application/zip",
            "totalBytes": archive.stat().st_size,
        }
    )
    with archive.open("rb") as file:
        response = httpx.put(signed["uploadUrl"], content=file, headers=signed.get("headers"), timeout=3600)
    response.raise_for_status()
    client.datasets.ingest(
        dataset["owner"],
        dataset["dataset"],
        body={"sessionId": signed["sessionId"]},
    )
```

Ingest is asynchronous. Poll
`client.datasets.retrieve(dataset["owner"], dataset["dataset"])["dataset"]` until `status` is
`ready` or `failed`, then verify split counts, class names, annotations, and `errorCount`. For a remote
archive, skip upload and ingest with `body={"sourceUrl": "https://.../data.zip"}`. Add
`targetSplit` only when every incoming image should enter one split. `conflictPolicy` accepts
`skip`, `keep_both`, or `replace`. Dataset ingest completes signed uploads automatically.

## Download or search

Use the `ul://` form in [SKILL.md](../SKILL.md) for YOLO. Use
`client.datasets.export(owner, dataset)["downloadUrl"]` for an NDJSON download, or
`client.explore.search(q="weld defect", type="datasets", task="detect")` for public discovery.
Pass `v=VERSION` to export a saved dataset version. `client.datasets.create_export(owner, dataset)`
creates a version, while `client.datasets.restore(owner, dataset, version=VERSION)` restores one.

## Hosted model inference

`client.models.predict` runs trained model weights. `client.deployments.predict` uses an existing
dedicated endpoint. Pass a binary `file` in `body` to send multipart form data. Use `conf` here, not
the annotation API's `confidence`. OpenAPI also accepts an image URL/base64 `source`, but SDK v0.1.62
sends source-only bodies as URL-encoded forms instead of the specified multipart form. Prefer the
file form with this SDK version.

```python
from pathlib import Path

from ultralytics_platform import Platform

with Platform() as client, Path("image.jpg").open("rb") as image:
    result = client.models.predict("ultralytics", "yolo26", "yolo26n", body={"file": image, "conf": 0.25})
    print(result["images"][0]["results"])
```

For a deployment, use `client.deployments.predict(owner, deployment, body={"file": image})` with
the file open. Results are grouped under `images` with `shape`, `speed`, and `results`, plus top-level
`metadata`. Boxes use pixel coordinates unless `normalize=True`. Model inference also accepts video
files, with one result per frame. Depth models accept images only and return an encoded depth map.

## Moondream and other AI annotation

Use `client.images.predict(image_id, model_id="moondream")` for an image already in a Platform
dataset. This calls `POST /api/images/{imageId}/predict`, not Moondream's own API. The request accepts
`modelId`, `confidence`, `iou`, and `classMapping`, not a free-form prompt or an image file.

The v0.1.62 `modelId` enum includes `moondream`, `qwen`, `florence2`, `owlv2`, `yoloe26x`, `sam3`,
`sam3.1`, and `groundingdino`. It also lists provider models such as `gpt-6-astra`, `claude-fable-5-1`,
and `gemini-3.8-flash`. Read the live enum for the current full list. A YOLO model uses an
`ul://owner/project/model` URI instead of a hosted model ID.

Hosted models detect the dataset's class names, with 1-100 classes and model-specific thresholds.
They do not return confidence scores. YOLO can return index-aligned `confidences`, and accepts
`class_mapping` to map each model class to a dataset class index or `None` to drop it. These calls
require dataset update permission. Connected datasets and depth datasets cannot use auto-annotation.
`images.retrieve` returns `properties.datasetId`, `classNames`, and `labels`. Compare that dataset ID
with the intended dataset's `id` before annotation, and display class names using each `classId`.

```python
from ultralytics_platform import Platform

image_id = "507f1f77bcf86cd799439011"

with Platform() as client:
    image = client.images.retrieve(image_id)
    print(image["classNames"], image["labels"])
    prediction = client.images.predict(image_id, model_id="moondream")
    print(prediction["modelUsed"], prediction.get("partial", False), prediction["predictions"])
```

`predictions` are proposed annotations, not saved labels. `partial=True` means output was truncated:
complete boxes were recovered, but objects or classes may be missing. Review before saving.
Annotations use `classId` and normalized `bbox=[x_center, y_center, width, height]`, with task-specific
geometry where applicable. Do not treat these as the model-inference response's pixel corner boxes.

To save reviewed predictions within the requested scope, call
`client.images.update(image_id, body={"labels": prediction["predictions"]})`, then retrieve the image
again. This replaces all existing labels. If retaining them, explicitly merge the reviewed label
sets first. Do not overwrite from a retrieval with `labelsTruncated=True`.

### Batch annotation and face blurring

Check `client.datasets.batch(owner, dataset)` before creating a run. After the user has authorized
the dataset, model, and billable scope:

```python
from ultralytics_platform import Platform

with Platform() as client:
    job = client.datasets.create_batch(
        "my-workspace", "my-dataset", body={"modelId": "moondream", "includeAnnotated": False}
    )
    print(job["jobId"])
    print(client.datasets.batch("my-workspace", "my-dataset"))
```

Batch annotation saves a dataset version, queues inference, and writes labels to unannotated images
by default. `includeAnnotated=True` also targets labeled images. Poll `datasets.batch` for
`activeJob.progress`, then inspect `lastRun.failed`, `stopped`, `error`, and `results.partialImages`.
The response has `activeJob` and `lastRun`, not a generic `status`. Match their `id` to the returned
`jobId`. Stop polling when that job finishes or the agreed time limit is reached.
`datasets.delete_batch` cancels an active run or settles billing and dismisses a finished run.
A `409` can mean an existing run, an unready dataset, or no
eligible images, so inspect the state before resubmitting. A `402` means insufficient credits.

The same batch API accepts `body={"operation": "blur", "preview": True}` to preview face blurring
on up to six images. Apply those prepared assets with `previewJobId` and the same settings after
review. Blurring changes pixels, preserves labels, creates no dataset version, and is billed by images
processed. Do not mistake it for annotation or start it when the user only requested predictions.

## Billable jobs

Confirm billable scope as described in [SKILL.md](../SKILL.md). Query availability rather than
hard-coding GPU stock.

```python
from ultralytics_platform import Platform

with Platform() as client:
    print(client.training.gpu_availability())
    job = client.training.start(
        model_id="MODEL_ID",
        gpu_type="rtx-4090",
        capture_dataset_version=True,
        train_args={"model": "yolo26n.pt", "data": "ul://owner/datasets/dataset", "epochs": 100},
    )
    print(job["billing"]["estimatedCostDisplay"])

    client.exports.create("owner", "project", "model", format="onnx")
    client.deployments.create(
        "owner",
        project="project",
        model="model",
        deployment="production",
        name="Production",
        region="europe-west1",
    )
```

`capture_dataset_version=True` saves an immutable dataset version for the training run. Training
returns `estimatedCost.pricePerHour` and billing details after it starts. Export and deployment
availability depends on the workspace plan and quota.
