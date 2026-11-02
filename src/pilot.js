/* AI Memory Lifeboat v0.4.0 — local opt-in, content-free pilot receipt. MIT.
 * NEVER include a filename, conversation, timestamp, fingerprint, original text, account, path or arbitrary user-supplied string.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.AMLPilot=api;
})(typeof globalThis==='object'?globalThis:null,function(){'use strict';
  const SCHEMA='aml.pilot-feedback.v1',VERSION='0.4.0';
  const choices=Object.freeze({
    ease:Object.freeze(['NOT_TESTED','EASY','NEEDED_HELP','COULD_NOT_FINISH']),
    clarity:Object.freeze(['NOT_TESTED','CLEAR','NEEDS_EXPLANATION','CONFUSING']),
    reuse:Object.freeze(['NOT_TESTED','YES','MAYBE','NO'])
  });
  function createReceipt(input={},mode='PERSONAL_EXPORT'){
    if(!input||typeof input!=='object'||Array.isArray(input))throw new TypeError('INVALID_FEEDBACK');
    if(!['PERSONAL_EXPORT','SYNTHETIC_DEMO'].includes(mode))throw new TypeError('INVALID_FEEDBACK_MODE');
    const out={};
    for(const [key,valid] of Object.entries(choices)){
      const value=input[key]===undefined?'NOT_TESTED':input[key];
      if(typeof value!=='string'||!valid.includes(value))throw new TypeError('INVALID_FEEDBACK_CHOICE');
      out[key]=value;
    }
    return {
      schema:SCHEMA, tool_version:VERSION, source_mode:mode,
      sharing:'USER_DOWNLOAD_ONLY_NOT_SUBMITTED',
      account_completeness:'NOT_VERIFIABLE_FROM_EXPORT',
      privacy:{contains_chat_text:false,contains_title:false,contains_id:false,contains_file_path:false,
        contains_email:false,contains_timestamp:false,contains_device_info:false},
      answers:out
    };
  }
  return Object.freeze({SCHEMA,VERSION,choices,createReceipt});
});
