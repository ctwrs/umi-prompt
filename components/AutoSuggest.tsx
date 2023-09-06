import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { JSXInternal } from "preact/src/jsx.d.ts";

type AutoSuggestProps = {
  dictionary: Record<string, Record<string, boolean>> | string[];
  onTagSelect: (selected: string) => void;
  onNewValue: (newValue: string) => void;
  placeholder?: string;
};

const autoSizeTextArea = (
  e: JSXInternal.TargetedFocusEvent<HTMLTextAreaElement>
) => {
  e.currentTarget.style.height = "auto";
  e.currentTarget.style.height = `${e.currentTarget.scrollHeight + 10}px`;
};

export const AutoSuggest = (
  props: AutoSuggestProps & JSXInternal.IntrinsicElements["textarea"],
) => {
  const {
    dictionary,
    onTagSelect,
    onNewValue,
    placeholder = "",
    value,
    ...rest
  } = props;

  const tags = useMemo(() => {
    const data = dictionary && !Array.isArray(dictionary)
      ? Object.keys(dictionary).reduce((a, c) => {
        a.push(...Object.keys(dictionary[c]));
        return a;
      }, [] as string[]) || []
      : [];

    return [...new Set(data)];
  }, [dictionary]);
  const [input, setInput] = useState(value || "");
  const [suggestions, setSuggestions] = useState<string[]>([] as string[]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const textarea = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (value && value !== input) {
      console.log("setInput", value);
      setInput(value);
    }
  }, [value]);

  const getSuggestions = (input: string) => {
    const suggestions: string[] = [];
    const inputRegex = /<\[(--)?(.*)(\]>)?/;
    const inputMatch = input.match(inputRegex);
    console.log("inputMatch", inputMatch, input);
    if (inputMatch && (inputMatch[1] || inputMatch[2])) {
      // const prefix = inputMatch[1] === "--";
      for (const suggestion of tags) {
        if (suggestion.startsWith(inputMatch[2])) {
          suggestions.push(suggestion);
        }
      }
    }
    console.log("suggestions", suggestions);
    return suggestions;
  };

  const handleKeyUp = (
    event: JSXInternal.TargetedKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    const input = event.currentTarget.value;
    const newSuggestions = getSuggestions(input);

    setSuggestions(newSuggestions);
    if (
      event.key.length === 1 || event.key === "Backspace" ||
      event.key === "Delete"
    ) {
      setInput(input);
      console.log("onNewValue", input);
      onNewValue && onNewValue(input);
    }
  };

  const handleKeyDown = (
    event: JSXInternal.TargetedKeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (!event.currentTarget?.value) return;
    autoSizeTextArea(event as unknown as JSXInternal.TargetedFocusEvent<HTMLTextAreaElement>);

    const input = event.currentTarget.value +
      (event.key.length === 1 ? event.key : "");
    const newSuggestions = getSuggestions(input);
    console.log(event.key, input, newSuggestions, selectedIndex);

    if (
      event.key === "ArrowDown" && selectedIndex < newSuggestions.length - 1
    ) {
      setSelectedIndex(selectedIndex + 1);
      event.preventDefault();
    } else if (event.key === "ArrowUp") {
      selectedIndex > 0 && setSelectedIndex(selectedIndex - 1);
      event.preventDefault();
    } else if (event.key === "Enter") {
      selectedIndex !== -1 && selectSuggestion(newSuggestions[selectedIndex]);
      event.preventDefault();
    } else if (event.key === "Tab") {
      if (newSuggestions.length > 0) {
        selectSuggestion(newSuggestions[0]);
      }
      event.preventDefault();
    }
  };

  const selectSuggestion = (suggestion: string) => {
    console.log("selectSuggestion", suggestion);
    onTagSelect(suggestion);
    if (textarea.current) {
      const newInput = input +
        "".replace(/<\[(--)?.+?\]>/, `<[${suggestion}]>`);
      setInput(newInput);
      setSuggestions([]);
      setSelectedIndex(-1);
      textarea.current.value = newInput;
    }
  };

  return (
    <div className="relative">
      <textarea
        role="searchbox"
        ref={textarea}
        placeholder={placeholder}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onfocusin={autoSizeTextArea}
        value={input}
        {...rest}
      />
      {/* {suggestions.length > 0 && (
        <ul className="absolute z-50 bg-white rounded-lg shadow-lg overflow-auto max-h-64 divide-y divide-gray-200 divide-opacity-50">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              className={`px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 ${
                index === selectedIndex ? "bg-gray-200" : ""
              }`}
              onMouseDown={() => selectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )} */}
    </div>
  );
};
