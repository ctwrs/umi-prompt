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

const prompt = signal("");
export type Match = {
  match: string;
  file: string;
  tags: RegExpMatchArray | null;
};
export type Matches = Match[] | undefined;
const parsedPrompt = signal<Matches>(undefined);

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
    console.error(
      "show actual errors in the ui that a file is corrupted yaml",
      e,
    );
    return {};
  }
};

const dl = (file: string) => {
  l("downloading", file);
  if (
    !capitalization.value || !capitalization.value?.[file] ||
    downloading.value.includes(file) || data.value?.[file]
  ) return;
  downloading.value.push(file);
  const actualFile = capitalization.value[file];
  fetch(
    "https://raw.githubusercontent.com/Klokinator/UnivAICharGen/master/wildcards/" +
      actualFile,
  ).then((res) => res.text()).then((text) => {
    const parsed = actualFile.includes(".yaml")
      ? parseYaml(text)
      : text.split("\n").filter((x: string) =>
        x.trim() !== "" && !x.trim().startsWith("#")
      );
    data.value = { ...data.value, [file]: parsed };
    downloading.value = downloading.value.filter((f) => f !== file);
  });
};

const handleNewPrompt = (p: string) => {
  prompt.value = p;
  parsedPrompt.value = parsePrompt(p);
  l("parsed prompt", parsedPrompt.value);
};

effect(() => {
  parsedPrompt.value?.map((match) => dl(match.file));
});

const autoSizeTextArea = (e: JSXInternal.TargetedEvent<HTMLTextAreaElement, Event>) => {
  if (!e.currentTarget) return;
  e.currentTarget.style.height = 'auto';
  e.currentTarget.style.height = `${e.currentTarget.scrollHeight + 10}px`;
};

const handler = (e: JSXInternal.TargetedEvent<HTMLTextAreaElement, Event>) => {
  if (!e.currentTarget) return;
  autoSizeTextArea(e);
  history.pushState(null, "", encodeURIComponent(e.currentTarget.value));
  handleNewPrompt(e.currentTarget.value);
};

const Match = (
  props: {
    d: Signal<Data>;
    dl: Signal<string[]>;
    match: { match: string; file: string; tags: RegExpMatchArray | null };
  },
) => {
  const dataFile = props.d.value[props.match.file.toLowerCase()];
  l("rendering match", props.match, dataFile);
  if (!dataFile) return <div>{ props.match.file !== '' ? 'loading...' : ''}</div>;
  const output = isArray(dataFile)
    ? dataFile
    : Object.keys(dataFile).filter((key: string) =>
      props.match.tags?.every((tag) => dataFile[key][tag.toLowerCase()])
    );
  return (
    <ul>
      {output.map((x: string) => <li class='bg-gray-100 text-sm hover:bg-blue-200 cursor-pointer border-b-1 border-white' onClick={() => {
        handleNewPrompt(prompt.value.replace(props.match.match, x));
      }}>{x}</li>)}
    </ul>
  );
};

const List = () => {
  return (
      <table class="align-top table-auto w-full p-10">
        <thead>
          <tr> <td  colSpan={parsedPrompt.value?.length}><div class='sticky left-0 '>
        <textarea
          // class='w-auto w-5/6 sm:w-full md:w-5/6'
          class="w-[100%] text-sm border-1 border-gray-100 transition duration-150 ease-in-out"
          value={prompt.value}
          onKeyUp={handler}
          onfocusin={autoSizeTextArea}
          type="text"
        />
        </div></td>     </tr>
          <tr class='align-bottom text-sm'>
            {parsedPrompt.value?.map((match) => <th>{match.match}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr class=" align-top ">
          {parsedPrompt.value?.map((match) => (
              <td>
                <Match d={data} dl={downloading} match={match} />
              </td>
          ))}
            </tr>
        </tbody>
      </table>
  );
};

const Debug = () => {
  console.log(data.value);
  return (
    <div class="w-full">
      <pre>{downloading}</pre>
      <pre>{Object.keys(data?.value)}</pre>
    </div>
  );
};

export default function Main(props: { prompt: string }) {
  useEffect(() => {
    handleNewPrompt(props.prompt);
  }, []);

  useEffect(() => {
    const listener = () => handleNewPrompt(decodeURIComponent(globalThis.location.pathname.slice(1)));
    globalThis.addEventListener('popstate', listener);

    return () => {
      globalThis.removeEventListener('popstate', listener);
    };
  }, []);

  useEffect(() => {
    fetch(asset("/files.txt")).then(async (res) => {
      const files = await res.text();
      capitalization.value = files
        .split("\n")
        .filter((f) =>
          f && !f.startsWith("#") && (f.endsWith(".txt") || f.endsWith(".yaml"))
        )
        .reduce((acc, file) => {
          acc[file.toLowerCase().split(".")[0]] = file;
          return acc;
        }, {} as Record<string, string>);
    }).then(() => {
      if (!prompt.value) return;
      setTimeout(() => handleNewPrompt(prompt.value));
    });
  }, []);

  const onInput = useMemo(() => debounce(handler, 100), []);

  return (
    <div class="place-content-center relative">
      {/* <Debug /> */}

      <List />
    </div>
  );
}
