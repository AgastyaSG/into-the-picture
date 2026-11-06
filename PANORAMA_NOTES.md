# Into the Picture — 360° prototype

V0.2 adds a panorama sphere viewer alongside the original local depth photo mode. Drag or arrow keys turn the camera; wheel zooms. A 2:1 equirectangular image supplies all directions. There is no translation, mesh reconstruction, collision, or editable Blender world.

## Generation

The included `dist/sample-panorama.png` is an AI interpretation of the public-domain Seurat painting, generated using the built-in image-generation tool with the painting as a reference. It is not an exact reconstruction. Seams, poles, composition, and generated figures can contain artifacts. It is a sample environment, not a claim that an arbitrary upload is automatically converted.

Prompt: Create a 2:1 equirectangular 360-degree spherical environment map for an immersive panorama viewer, inspired by this public-domain Seurat painting. The viewer stands at eye height inside this riverside park. Preserve the pointillist brushwork, muted period colors, nineteenth-century clothing, trees, grass, and river. Adapt the reference composition in the forward direction and invent coherent surroundings behind and beside the viewer. The horizon is exactly halfway down. Correct equirectangular projection with sky at the zenith and grass at the nadir, continuous matching left and right edges. Full 360 degrees horizontally and 180 degrees vertically. One seamless environment texture, no frame, no text, no UI, no panels. Output a wide 2:1 image, ideally 2048 by 1024.

## Free model route

https://huggingface.co/spaces/linoyts/flux2-klein-360-erp-outpaint-4b

This Space was running at investigation time, but our anonymous generation call returned an error without details. It therefore is linked as an optional manual route, not integrated as a reliable backend. GPU access, login requirements, and quota must be verified on the actual account. A student email alone proves no entitlement.

Use the Space's visual reference placement, generate an ERP panorama, download the image, and choose Open a 360° panorama in this demo. This sends the source to that external service. Local imports in our viewer stay on device. Ordinary pictures use the depth mode; they are never stretched into a fake panorama.

Next product milestone: integrate a verified free generation endpoint or a university GPU worker with queue, job status, failure handling, and panorama validation. Start with low resolution. If no GPU allowance is available, keep manual import and pre-generated examples until one is verified.
