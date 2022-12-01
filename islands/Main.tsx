import { lodash as _ } from "lodash";
import { parse, stringify } from "yaml";

import { useEffect, useMemo } from "preact/hooks";
import {
  computed,
  effect,
  Signal,
  signal,
  useComputed,
  useSignal,
} from "@preact/signals";
import { Input } from "../components/Input.tsx";
import { asset } from "https://deno.land/x/fresh@1.1.2/runtime.ts";
import { parsePrompt } from "../utils/parsePrompt.ts";
import { debounce } from "https://deno.land/std@0.150.0/async/debounce.ts";
import { JSXInternal } from "https://esm.sh/v95/preact@10.11.0/src/jsx.d.ts";
import { isArray } from "https://deno.land/std@0.165.0/encoding/_yaml/utils.ts";

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

const l = console.log;

const useUuid = () => useMemo(() => crypto.randomUUID(), []);

const prompt = signal('');
const parsedPrompt = signal<{ match: string, file: string, tags: RegExpMatchArray | null}[] | undefined>(undefined);

const capitalization = signal<Record<string, string>>({});


const downloading = signal<string[]>([]);

type Data = Record<string, string[] | Record<string, Record<string, boolean>>>;
const data = signal<Data>({});

const parseYaml = (text: string) => {
  try {
    const parsed = parse(text) as Record<string, { Tags: string[] }>;
    return Object.keys(parsed).reduce((acc, item) => {
      acc[item.toLowerCase()] = parsed[item].Tags.reduce((acc, tag) => {
        acc[tag.toLowerCase()] = true;
        return acc;
      }, {} as Record<string, boolean>);

      return acc;
    }, {} as Record<string, Record<string, boolean>>);
  } catch (e) {
    console.error('show actual errors in the ui that a file is corrupted yaml', e);
    return {};
  }
};

const dl = (file: string) => {
  if (!capitalization.value || !capitalization.value?.[file] || downloading.value.includes(file)) return;
  downloading.value.push(file);
  const actualFile = capitalization.value[file];
  fetch(
        "https://raw.githubusercontent.com/Klokinator/UnivAICharGen/master/wildcards/" + actualFile,
      ).then((res) => res.text()).then((text) => {
        const parsed = actualFile.includes('.yaml') ? parseYaml(text) : text.split('\n').filter((x: string) => x.trim() !== '' && !x.trim().startsWith('#'));
        data.value = { ...data.value, [file]: parsed };
        downloading.value = downloading.value.filter((f) => f !== file);
      });
}

const handleNewPrompt = (p: string) => {
  prompt.value = p;
  parsedPrompt.value = parsePrompt(p);
  parsedPrompt.value?.map((match) => dl(match.file));
}

const x = effect(() => {
  if (downloading.value.length !== 0) return;
  parsedPrompt.value = parsePrompt(prompt.value);
});

const handler = (e: JSXInternal.TargetedEvent<HTMLInputElement, Event>) => {
  if (!e.currentTarget) return;
  l(e.currentTarget.value)
  prompt.value = e.currentTarget.value;
  handleNewPrompt(prompt.value);
};

const d = _.throttle(handler, 100);

const Match = (props: { d: Signal<Data>; dl: Signal<string[]>; match : { match: string, file: string, tags: RegExpMatchArray | null} }) => {
  const dataFile = props.d.value[props.match.file];
  if (!dataFile || props.dl.value.length === 0) return <div>loading...</div>;
  const output = isArray(dataFile) ? dataFile : Object.keys(dataFile).filter((key: string) => props.match.tags?.every((tag) => dataFile[key][tag.toLowerCase()]));
  return (<ul>
    {output.map((x: string) => <li>{x}</li>)}
  </ul>);
}

export default function Main(props: { prompt: string }) {
  useEffect(() => {
    prompt.value = props.prompt;
    handleNewPrompt(prompt.value);
  }, [])

  useEffect(() => {
    fetch(asset("/files.txt")).then(async (res) => {
      const files = await res.text();
      capitalization.value = files
        .split("\n")
        .filter((f) => f && !f.startsWith("#") && (f.endsWith(".txt") || f.endsWith('.yaml')))
        .reduce((acc, file) => {
          acc[file.toLowerCase().split('.')[0]] = file;
          return acc;
        }, {} as Record<string, string>);

      // testing
      // handleNewPrompt('<clothing|[HighSFW]> adsf');

    });
  }, []);

  const onInput = useMemo(() => debounce(handler, 100), []);

  return (
    <div class="container place-content-center">
      <div class='m-00'>
      <input
        // class='w-auto w-5/6 sm:w-full md:w-5/6'
        class="w-full border-1 h-[32px] border-gray-100 transition duration-150 ease-in-out"
        value={prompt.value}
        onKeyUp={d}
        type="text"
      />
      </div>
      <div class='w-full'>
      {parsedPrompt.value?.map((match) => (<Match d={data} dl={downloading} match={match} />)) || <></>}
      </div>
    </div>
  );
}
