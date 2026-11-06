import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
let estimator;
self.onmessage = async ({data}) => {
  const {id,image} = data;
  try {
    if (!estimator) {
      self.postMessage({id,type:'status',message:'Downloading the depth model. The first run takes longer.'});
      estimator = await pipeline('depth-estimation','onnx-community/depth-anything-v2-small',{device:'wasm',dtype:'q8',progress_callback:p=>{
        if(p.status==='progress')self.postMessage({id,type:'progress',progress:p.progress});
      }});
    }
    self.postMessage({id,type:'status',message:'Reading near and far surfaces…'});
    const {depth} = await estimator(image);
    const pixels = new Uint8Array(depth.data);
    self.postMessage({id,type:'result',width:depth.width,height:depth.height,channels:depth.channels,pixels},[pixels.buffer]);
  } catch(error) {
    estimator = null;
    self.postMessage({id,type:'error',message:error.message || String(error)});
  }
};
