import{c as o,j as e,p as m,r as h}from"./index-CtOAjnqL.js";import{C as p}from"./EmptyState-BkI3LeiW.js";/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=o("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=o("ChevronsLeft",[["path",{d:"m11 17-5-5 5-5",key:"13zhaf"}],["path",{d:"m18 17-5-5 5-5",key:"h8a8et"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=o("ChevronsRight",[["path",{d:"m6 17 5-5-5-5",key:"xnjwq"}],["path",{d:"m13 17 5-5-5-5",key:"17xmmf"}]]);/**
 * @license lucide-react v0.469.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=o("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]),C=({metaData:r,onPageChange:i})=>{const{pageIndex:t,totalPages:c,totalCount:l,showing:x}=r;if(c<=1)return e.jsx("div",{className:"flex items-center justify-between px-1 py-2 text-sm text-surface-500",children:e.jsx("span",{children:x})});const n=[],d=2;for(let s=1;s<=c;s++)s===1||s===c||s>=t-d&&s<=t+d?n.push(s):n[n.length-1]!=="..."&&n.push("...");return e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-3 px-1 py-2",children:[e.jsx("p",{className:"text-sm text-surface-500",children:x}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx(a,{onClick:()=>i(1),disabled:t===1,title:"First page",children:e.jsx(j,{size:16})}),e.jsx(a,{onClick:()=>i(t-1),disabled:t===1,title:"Previous page",children:e.jsx(f,{size:16})}),n.map((s,u)=>s==="..."?e.jsx("span",{className:"px-2 text-surface-400 select-none",children:"..."},`ellipsis-${u}`):e.jsx(a,{onClick:()=>i(s),active:s===t,children:s},s)),e.jsx(a,{onClick:()=>i(t+1),disabled:t===c,title:"Next page",children:e.jsx(p,{size:16})}),e.jsx(a,{onClick:()=>i(c),disabled:t===c,title:"Last page",children:e.jsx(b,{size:16})})]})]})},a=({active:r,className:i,children:t,...c})=>e.jsx("button",{className:m("min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors","disabled:opacity-40 disabled:cursor-not-allowed",r?"bg-primary-800 text-white":"text-surface-600 hover:bg-surface-100 hover:text-surface-900",i),...c,children:t});function w(r,i){const[t,c]=h.useState(r);return h.useEffect(()=>{const l=setTimeout(()=>c(r),i);return()=>clearTimeout(l)},[r,i]),t}export{C as P,v as S,w as u};
