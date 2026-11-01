import * as React from "react"
import type { ComponentType } from "react"
import { RenderTarget, useIsStaticRenderer } from "framer"
/**
 * SOURCE INSPIRATION / HERO-004 — Artemii Lebedev.
 * Native utility ink companion to the unchanged SourcePortfolioFilmStudy.
 * The retained primary uses transparent rows, white base ink, a full-row
 * white progress fill and a progress-clipped black duplicate text layer.
 * Apply one override below to each native black-copy group (not to the base
 * text or progress fill). Every word remains a selectable native Text layer.
 * Read-only bridge to our own documented/versioned film control store;
 * no website behavior JS, Framer internals, polling, RAF, media or GPU work.
 * The group must be a child of its corresponding withFilm…Row so that the
 * actor/native-row package establishes the store before this layout effect.
 * Canvas/export/thumbnail freeze matches the original progress override.
 * Reduced motion and Pause retain the producer's current exact fill rather
 * than inventing an independent timer. All subscriptions clean on unmount.
 */
type Props = {[key:string]:unknown;style?:React.CSSProperties;children?:React.ReactNode}
type FilmStore = {get:()=>{project:number;reduced:boolean};clock:()=>{progress:number};subscribe:(listener:()=>void)=>()=>void;subscribeClock:(listener:()=>void)=>()=>void}
const CONTROL=Symbol.for("monarchic.source-portfolio-controls.v1")
const useOwnLayoutEffect=typeof window==="undefined"?React.useEffect:React.useLayoutEffect
function store():FilmStore|undefined{if(typeof window==="undefined")return undefined;return(window as unknown as Record<symbol,FilmStore|undefined>)[CONTROL]}
function writeRef<T>(ref:React.ForwardedRef<T>,node:T|null){if(typeof ref==="function")ref(node);else if(ref)ref.current=node}
function useFrozen(){const target=RenderTarget.current();return useIsStaticRenderer()||target===RenderTarget.canvas||target===RenderTarget.export||target===RenderTarget.thumbnail}
function ink(Component:ComponentType<Props>,index:number):ComponentType<Props>{return React.forwardRef<HTMLElement,Props>((props,ref)=>{const frozen=useFrozen(),own=React.useRef<HTMLElement|null>(null);useOwnLayoutEffect(()=>{const element=own.current;if(!element)return;const producer=store();let previous=-1;const update=()=>{const raw=!frozen&&producer?.get().project===index?producer.clock().progress:0,progress=Number.isFinite(raw)?Math.max(0,Math.min(1,raw)):0;if(progress===previous)return;previous=progress;element.style.clipPath="inset(0 "+(100-progress*100)+"% 0 0)";element.setAttribute("data-source-film-ink-progress",String(progress))};update();if(frozen||!producer)return;const removeState=producer.subscribe(update),removeClock=producer.subscribeClock(update);return()=>{removeClock();removeState()}},[frozen,index]);return <Component {...props} ref={(node:HTMLElement|null)=>{own.current=node;writeRef(ref,node)}} aria-hidden={true} data-source-film-ink={index} style={{...props.style,clipPath:"inset(0 100% 0 0)",pointerEvents:"none"}}/>}) as ComponentType<Props>}
export function withFilmPonderInk(Component:ComponentType<Props>):ComponentType<Props>{return ink(Component,0)}
export function withFilmCantorInk(Component:ComponentType<Props>):ComponentType<Props>{return ink(Component,1)}
export function withFilmBetterLouInk(Component:ComponentType<Props>):ComponentType<Props>{return ink(Component,2)}
export function withFilmFrequencyInk(Component:ComponentType<Props>):ComponentType<Props>{return ink(Component,3)}
export function withFilmGoomInk(Component:ComponentType<Props>):ComponentType<Props>{return ink(Component,4)}
export function withFilmMonolithInk(Component:ComponentType<Props>):ComponentType<Props>{return ink(Component,5)}
export function withFilmTigerInk(Component:ComponentType<Props>):ComponentType<Props>{return ink(Component,6)}
export function withFilmOxiInk(Component:ComponentType<Props>):ComponentType<Props>{return ink(Component,7)}
