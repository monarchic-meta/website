import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"
/**
 * SOURCE INSPIRATION / HERO-008 — PP Neue Montreal, Pangram Pangram.
 * Independent native-layer implementation of two inspected current-source
 * accents: the specific “Already in Use,” / “Worldwide!” character wave and
 * the square/round semicolon. The four cubic paths below are retained source
 * geometry data. No source website behavior JavaScript is imported or copied.
 * Wave:12px Desktop/4px Phone,1.4s period,.07s per-character delay across both
 * lines. Morph:.8s each direction/1s holds/1.8s initial delay; cubic(.76,0,.24,1).
 * Source facts come from retained public implementation inspection, not newly
 * isolated selected-archive interaction. Native letters/dot/comma stay editable;
 * static prior placeholders must remain mounted opacity0 as comparison layers.
 * Native wave letter spacing/font sizing is authored in the separate binding
 * packet; source automatic text fitting is not silently claimed here.
 * Self-contained: no Canvas/WebGL/font fetch/private Framer DOM or idle RAF.
 * Own CSS animations pause while offscreen/document-hidden or Core-paused;
 * Canvas/export/thumbnail/reduced motion show the square, unshifted still.
 */
type Props = { [key:string]:unknown; style?:React.CSSProperties; children?:React.ReactNode; text?:string }
type Native = ComponentType<Props>
type Playback = {paused:boolean;listeners:Set<()=>void>}
const PLAYBACK=Symbol.for("monarchic.sourceMontreal.playback.v1")
const useOwnLayoutEffect=typeof window==="undefined"?React.useEffect:React.useLayoutEffect
function writeRef<T>(ref:React.ForwardedRef<T>,node:T|null){if(typeof ref==="function")ref(node);else if(ref)ref.current=node}
function playback():Playback{if(typeof window==="undefined")return{paused:false,listeners:new Set()};const realm=window as unknown as Record<symbol,Playback>;if(!realm[PLAYBACK])realm[PLAYBACK]={paused:false,listeners:new Set()};return realm[PLAYBACK]}
function subscribePlayback(listener:()=>void){const state=playback();state.listeners.add(listener);return()=>state.listeners.delete(listener)}
const noSubscribe=(_listener:()=>void)=>()=>{}
function useFrozen(){const target=RenderTarget.current();return useIsStaticRenderer()||target===RenderTarget.canvas||target===RenderTarget.export||target===RenderTarget.thumbnail}
function usePaused(frozen:boolean){return React.useSyncExternalStore(frozen?noSubscribe:subscribePlayback,()=>frozen||playback().paused,()=>true)}
function useReduced(){const[reduced,setReduced]=React.useState(()=>typeof window!=="undefined"&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);React.useEffect(()=>{const query=window.matchMedia("(prefers-reduced-motion: reduce)"),change=()=>setReduced(query.matches);change();query.addEventListener("change",change);return()=>query.removeEventListener("change",change)},[]);return reduced}
function useOwnVisible(node:React.RefObject<HTMLElement|null>,frozen:boolean){const[visible,setVisible]=React.useState(false),[hidden,setHidden]=React.useState(false);React.useEffect(()=>{const element=node.current;if(frozen||!element)return;const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:[0,.2]}),change=()=>setHidden(document.hidden);observer.observe(element);change();document.addEventListener("visibilitychange",change);return()=>{observer.disconnect();document.removeEventListener("visibilitychange",change)}},[frozen]);return visible&&!hidden}
type AccentState={live:boolean;frozen:boolean;width:number;height:number;id:string}
const DEFAULT:AccentState={live:false,frozen:true,width:130,height:680,id:"montreal-accent-still"}
const WaveContext=React.createContext<AccentState>(DEFAULT),MorphContext=React.createContext<AccentState>(DEFAULT)
function nativeGroup(Component:Native,kind:"wave"|"morph"):Native{return React.forwardRef<HTMLElement,Props>((props,ref)=>{const frozen=useFrozen(),reduced=useReduced(),paused=usePaused(frozen),own=React.useRef<HTMLElement|null>(null),visible=useOwnVisible(own,frozen),id=React.useId().replace(/[^a-zA-Z0-9_-]/g,"_"),[size,setSize]=React.useState({width:kind==="wave"?1420:130,height:kind==="wave"?390:680});useOwnLayoutEffect(()=>{const element=own.current;if(!element)return;const measure=()=>{const width=element.clientWidth,height=element.clientHeight;setSize(previous=>previous.width===width&&previous.height===height?previous:{width,height})};measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect()},[]);const state={...size,id,live:!frozen&&!reduced&&!paused&&visible,frozen:frozen||reduced},Context=kind==="wave"?WaveContext:MorphContext;return <Context.Provider value={state}><Component {...props} ref={(node:HTMLElement|null)=>{own.current=node;writeRef(ref,node)}} data-montreal-accent-group={kind} data-montreal-accent-live={state.live} data-montreal-accent-frozen={state.frozen}/></Context.Provider>}) as Native}
export function withMontrealLanguageWave(Component:ComponentType<Props>):ComponentType<Props>{return nativeGroup(Component,"wave")}
export function withMontrealSemicolonMorph(Component:ComponentType<Props>):ComponentType<Props>{return nativeGroup(Component,"morph")}
const WAVE_LINES=["Already in Use,","Worldwide!"] as const
function waveLetter(Component:Native,index:number):Native{return React.forwardRef<HTMLElement,Props>((props,ref)=>{const state=React.useContext(WaveContext),id="montreal_wave_"+state.id,amplitude=state.width<810?4:12,space=index===7||index===10;return <><Component {...props} ref={ref} data-montreal-wave-letter={index} data-montreal-wave-line={index<WAVE_LINES[0].length?0:1} style={{...props.style,animationName:state.frozen||space?"none":id,animationDuration:"1.4s",animationTimingFunction:"ease-in-out",animationIterationCount:"infinite",animationDelay:String(index*.07)+"s",animationFillMode:"both",animationPlayState:state.live?"running":"paused"}}/><style>{"@keyframes "+id+"{0%,100%{translate:0 0}50%{translate:0 -"+amplitude+"px}}"}</style></>}) as Native}
export function withMontrealWaveLetter01(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,0)}
export function withMontrealWaveLetter02(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,1)}
export function withMontrealWaveLetter03(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,2)}
export function withMontrealWaveLetter04(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,3)}
export function withMontrealWaveLetter05(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,4)}
export function withMontrealWaveLetter06(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,5)}
export function withMontrealWaveLetter07(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,6)}
export function withMontrealWaveLetter08(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,7)}
export function withMontrealWaveLetter09(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,8)}
export function withMontrealWaveLetter10(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,9)}
export function withMontrealWaveLetter11(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,10)}
export function withMontrealWaveLetter12(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,11)}
export function withMontrealWaveLetter13(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,12)}
export function withMontrealWaveLetter14(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,13)}
export function withMontrealWaveLetter15(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,14)}
export function withMontrealWaveLetter16(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,15)}
export function withMontrealWaveLetter17(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,16)}
export function withMontrealWaveLetter18(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,17)}
export function withMontrealWaveLetter19(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,18)}
export function withMontrealWaveLetter20(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,19)}
export function withMontrealWaveLetter21(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,20)}
export function withMontrealWaveLetter22(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,21)}
export function withMontrealWaveLetter23(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,22)}
export function withMontrealWaveLetter24(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,23)}
export function withMontrealWaveLetter25(Component:ComponentType<Props>):ComponentType<Props>{return waveLetter(Component,24)}
const DOT_SQUARE="M61.5 6.1C61.5 6.1 116.9 6.1 116.9 6.1C116.9 6.1 116.9 61.5 116.9 61.5C116.9 61.5 116.9 116.9 116.9 116.9C116.9 116.9 61.5 116.9 61.5 116.9C61.5 116.9 6.1 116.9 6.1 116.9C6.1 116.9 6.1 61.5 6.1 61.5C6.1 61.5 6.1 6.1 6.1 6.1C6.1 6.1 61.5 6.1 61.5 6.1Z"
const DOT_ROUND="M61.5 0.5C77.678 0.5 93.194 6.927 104.634 18.366C116.073 29.806 122.5 45.322 122.5 61.5C122.5 77.678 116.073 93.194 104.634 104.634C93.194 116.073 77.678 122.5 61.5 122.5C45.322 122.5 29.806 116.073 18.366 104.634C6.927 93.194 0.5 77.678 0.5 61.5C0.5 45.322 6.927 29.806 18.366 18.366C29.806 6.927 45.322 0.5 61.5 0.5Z"
const COMMA_SQUARE="M0 199.642C20.772 192.718 35.0047 182.717 42.698 169.638C50.3913 157.329 53.8533 137.711 53.084 110.784C53.084 110.784 26.542 110.784 26.542 110.784C26.542 110.784 0 110.784 0 110.784C0 110.784 0 55.392 0 55.392C0 55.392 0 0 0 0C0 0 55.392 0 55.392 0C55.392 0 110.784 0 110.784 0C110.784 0 110.784 110.784 110.784 110.784C110.784 134.633 107.322 155.79 100.398 174.254C94.2433 193.487 82.7033 210.028 65.778 223.876C49.622 237.724 27.696 248.879 0 257.342V199.642Z"
const COMMA_ROUND="M5.77 199.642C26.542 193.487 43.4673 183.101 56.546 168.484C69.6247 154.636 76.164 136.941 76.164 115.4C64.624 120.016 52.6993 121.17 40.39 118.862C28.85 116.554 19.2333 110.784 11.54 101.552C3.84667 91.5507 0 78.8567 0 63.47C0 43.4674 5.38533 28.0807 16.156 17.31C26.9267 5.77 41.1593 0 58.854 0C81.934 0 98.8593 8.07801 109.63 24.234C121.17 39.6207 126.94 61.9313 126.94 91.166C126.94 114.246 122.709 136.172 114.246 156.944C105.783 177.716 92.32 196.18 73.856 212.336C56.1613 228.492 33.466 240.801 5.77 249.264V199.642Z"
function scaledPath(source:string,scale:number){return source.replace(/-?(?:\d*\.)?\d+/g,value=>String(Number(value)*scale))}
function semicolonPart(Component:Native,comma:boolean):Native{return React.forwardRef<HTMLElement,Props>((props,ref)=>{const state=React.useContext(MorphContext),scale=Math.max(0,Math.min(state.width/130,state.height/680)),left=(state.width-130*scale)/2,top=(state.height-680*scale)/2+(comma?394*scale:0),square=scaledPath(comma?COMMA_SQUARE:DOT_SQUARE,scale),round=scaledPath(comma?COMMA_ROUND:DOT_ROUND,scale),id="montreal_morph_"+state.id+(comma?"_comma":"_dot"),squareClip="path('"+square+"')",roundClip="path('"+round+"')";return <><Component {...props} ref={ref} data-montreal-semicolon-part={comma?"comma":"dot"} data-montreal-semicolon-scale={scale} style={{...props.style,position:"absolute",left,top,width:130*scale,height:(comma?286:130)*scale,clipPath:squareClip,animationName:state.frozen?"none":id,animationDuration:"3.6s",animationTimingFunction:"cubic-bezier(.76,0,.24,1)",animationIterationCount:"infinite",animationDelay:"1.8s",animationFillMode:"both",animationPlayState:state.live?"running":"paused"}}/><style>{"@keyframes "+id+"{0%{clip-path:"+squareClip+"}22.222222%,50%{clip-path:"+roundClip+"}72.222222%,100%{clip-path:"+squareClip+"}}"}</style></>}) as Native}
export function withMontrealSemicolonDot(Component:ComponentType<Props>):ComponentType<Props>{return semicolonPart(Component,false)}
export function withMontrealSemicolonComma(Component:ComponentType<Props>):ComponentType<Props>{return semicolonPart(Component,true)}
