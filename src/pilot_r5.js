/* AI Memory Lifeboat v0.5.0 — separate, opt-in pilot v2. MIT.
 * All fields are fixed enums. No location, timestamps, filenames, source content or automatic submission.
 * The older v1 receipt remains available through src/pilot.js for backward compatibility.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.AMLPilotR5=api;
})(typeof globalThis==='object'?globalThis:null,function(){'use strict';
 const VERSION='0.5.0',SCHEMA='aml.pilot-feedback.v2';
 const choices=Object.freeze({
   ease:Object.freeze(['NOT_TESTED','EASY','NEEDED_HELP','COULD_NOT_FINISH']),
   clarity:Object.freeze(['NOT_TESTED','CLEAR','NEEDS_EXPLANATION','CONFUSING']),
   reuse:Object.freeze(['NOT_TESTED','YES','MAYBE','NO']),
   firstTask:Object.freeze(['NOT_TESTED','COMPLETED_ALONE','COMPLETED_WITH_HELP','COULD_NOT_FINISH']),
   understandsScope:Object.freeze(['NOT_TESTED','YES','UNSURE','NO'])
 });
 function createReceipt(input={},sourceMode='PERSONAL_EXPORT'){
   if(input===null||typeof input!=='object'||Array.isArray(input))throw new TypeError('INVALID_FEEDBACK');
   if(sourceMode!=='PERSONAL_EXPORT'&&sourceMode!=='SYNTHETIC_DEMO')throw new TypeError('INVALID_FEEDBACK_MODE');
   const answers={};
   for(const [name,allow] of Object.entries(choices)){
     const choice=input[name]===undefined?'NOT_TESTED':input[name];
     if(typeof choice!=='string'||!allow.includes(choice))throw new TypeError('INVALID_FEEDBACK_CHOICE');
     answers[name]=choice;
   }
   return {
     schema:SCHEMA,tool_version:VERSION,source_mode:sourceMode,
     sharing:'USER_DOWNLOAD_ONLY_NOT_SUBMITTED',
     evidence_status:'SELF_REPORTED_NOT_INDEPENDENT_HUMAN_VERIFICATION',
     account_completeness:'NOT_VERIFIABLE_FROM_EXPORT',
     privacy:{contains_chat_text:false,contains_title:false,contains_id:false,contains_file_path:false,
       contains_email:false,contains_timestamp:false,contains_device_info:false},
     answers
   };
 }
 return Object.freeze({VERSION,SCHEMA,choices,createReceipt});
});
