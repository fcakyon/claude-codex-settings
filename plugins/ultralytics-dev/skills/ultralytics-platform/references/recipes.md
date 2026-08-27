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
    client.upload.complete(session_id=signed["sessionId"])
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
`targetSplit` only when every incoming image should enter one split.

## Download or search

Use the `ul://` form in [SKILL.md](../SKILL.md) for YOLO. Use
`client.datasets.export(owner, dataset)["downloadUrl"]` for an NDJSON download, or
`client.explore.search(q="weld defect", type="datasets", task="detect")` for public discovery.

## Billable jobs

Ask for approval before these create calls. Query availability rather than hard-coding GPU stock.

```python
from ultralytics_platform import Platform

with Platform() as client:
    print(client.training.gpu_availability())
    job = client.training.start(
        model_id="MODEL_ID",
        gpu_type="rtx-4090",
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

Training returns billing details after the job starts. Export and deployment availability depends
on the workspace plan and quota.
