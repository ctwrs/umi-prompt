import { lodash as _ } from "lodash";
import { parse, stringify } from "yaml";

import { useEffect, useMemo } from "preact/hooks";
import {
  computed,
  Signal,
  signal,
  useComputed,
  useSignal,
} from "@preact/signals";


let ls: Storage;
if (typeof localStorage !== "undefined") {
  ls = localStorage;
} else {
  // @ts-ignore we dont use more than get and set
  ls = {
    getItem: () => null,
    setItem: () => {},
  };
}


const useUuid = () => useMemo(() => crypto.randomUUID(), []);


export default function Main(props: { prompt: string }) {
    const prompt = useSignal(props.prompt);
    const files = useEffect()
}