# Into the Picture

Turn a photo into a scene you can explore in your browser.

- **Spatial photos:** Depth Anything V2 estimates depth locally; Three.js renders a textured mesh with nearby viewpoint movement.
- **360-degree panoramas:** Import an equirectangular panorama or explore the included generated example.
- Compare the original image, inspect depth, adjust the effect, and export a PNG.
- No account or API key is required. Local image processing stays in the browser; model files download on first use.

## Run locally

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. The app needs WebGL, browser workers, WebAssembly, and an internet connection for the first model download. There is no build step.

## Scope

This is a spatial-photo and panorama prototype. Depth mode reconstructs the visible surface with estimated relative depth; it does not generate hidden surfaces. Panorama mode allows rotation and zoom, not walking through a reconstructed world. The included panorama is a generated interpretation, and automatic panorama generation from arbitrary uploads is not integrated.

See [build notes](BUILD_NOTES.md) and [panorama notes](PANORAMA_NOTES.md) for existing checks and limitations.

## Credits

- [Depth Anything V2 Small](https://huggingface.co/onnx-community/depth-anything-v2-small), loaded through Transformers.js 3.8.1.
- [Three.js](https://threejs.org/), r170. Its bundled distribution retains its copyright notice; the full MIT license is in `THIRD_PARTY_LICENSES.txt`.
- Example painting: Georges Seurat, *A Sunday on La Grande Jatte — 1884*, [Art Institute of Chicago, artwork 27992](https://www.artic.edu/artworks/27992), public-domain image. The sample panorama is AI-generated from this reference.

Third-party code and models retain their respective licenses. No additional license is assigned to the original project code here.
