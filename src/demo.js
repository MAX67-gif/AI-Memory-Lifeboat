/* AI Memory Lifeboat v0.4.0 — wholly synthetic local first-use demo. MIT. */
(function(root, factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.AMLDemo=api;
})(typeof globalThis==='object'?globalThis:null,function(){'use strict';
  const NEWER=[{"id":"synthetic-demo-001","title":"Weekend weather plan (updated)","create_time":1730000000,"update_time":1730000120,"current_node":"reply","mapping":{"prompt":{"id":"prompt","parent":null,"children":["reply"],"message":{"author":{"role":"user"},"content":{"content_type":"text","parts":["What should I do if the weather is rainy?"]},"create_time":1730000000}},"reply":{"id":"reply","parent":"prompt","children":[],"message":{"author":{"role":"assistant"},"content":{"content_type":"text","parts":["Bring an umbrella and choose an indoor activity. (updated plan)"]},"create_time":1730000120}}}},{"id":"sample-new-only","title":"New example reminder","mapping":{"a":{"parent":null,"message":{"author":{"role":"user"},"content":{"content_type":"text","parts":["This is a synthetic demonstration item."]}}}},"current_node":"a"}];
  const OLDER=[{"id":"synthetic-demo-001","title":"Weekend weather plan (original)","create_time":1730000000,"update_time":1730000120,"current_node":"reply","mapping":{"prompt":{"id":"prompt","parent":null,"children":["reply"],"message":{"author":{"role":"user"},"content":{"content_type":"text","parts":["What should I do if the weather is rainy?"]},"create_time":1730000000}},"reply":{"id":"reply","parent":"prompt","children":[],"message":{"author":{"role":"assistant"},"content":{"content_type":"text","parts":["Bring an umbrella and choose an indoor activity."]},"create_time":1730000120}}}},{"id":"sample-old-only","title":"Original lesson notes","mapping":{"a":{"parent":null,"message":{"author":{"role":"user"},"content":{"content_type":"text","parts":["These are fictional example notes."]}}}},"current_node":"a"}];
  return Object.freeze({getSnapshots(){
    return {newer:JSON.parse(JSON.stringify(NEWER)),older:JSON.parse(JSON.stringify(OLDER))};
  }});
});
