# Prototype v0.1

The implemented slice is image → estimated depth → textured geometry → nearby exploration. It uses no paid generation service or API key. Uploaded image pixels stay in the browser. The example image and precomputed model depth are shipped with the site.

The depth model is Depth Anything V2 Small, quantized for WASM inference via Transformers.js 3.8.1. The model is fetched when a visitor first processes an upload. The viewer uses Three.js 0.170.0.

## Evidence

A real browser run completed model inference on an uploaded image and returned a nonconstant 1024 × 686 depth map. Checks exercised camera movement, original-image comparison, depth-map toggle, narrow-screen overflow, and PNG export. Narrow-screen rendering was checked in desktop Chrome emulation, not on a physical phone.

## Limits

- Estimated relative depth, with arbitrary scene scale.
- One visible textured surface; hidden surfaces are not generated.
- Movement is constrained to nearby camera positions.
- Paintings can have ambiguous depth. Depth edges can stretch under camera motion.
- First-run model download and inference can be slow on less capable devices.
- Browser WebGL, workers, WASM, and external model download must be available.

## Next useful experiment

Collect a small mix of photographs and paintings. Have people try the demo without instructions. Record model failures, load time, whether the depth feels plausible, and whether the navigation helps them inspect the scene. Use this evidence before choosing a hosted full-scene reconstruction model.
