import { Match, Matches } from "../islands/Main.tsx";

const prompt_regex = /((__|<)(.*?)(__|>))/g;
const tags_regex = /(?<=\[)(.*?)(?=\])/g;

export const parsePrompt = (prompt: string): Matches => {
    const matches = prompt.match(prompt_regex)?.map((match) => {
        const file = match.indexOf(':') !== -1 ? match.split(':')[0].replaceAll('<', '').replaceAll('__', '').toLowerCase() : '';
        const tags = match.match(tags_regex);
        console.log(match, file, tags);
        return { match, file, tags };
    });

    if (!matches?.length) return [{ match: prompt, file: '', tags: null }];

    const out: Match[] = [];
    
    let rest = prompt;
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const [before, after] = rest.split(match.match);
        before.length && out.push({ match: before, file: '', tags: null });
        out.push(match);
        rest = after;
        if (i === matches.length - 1) after.length && out.push({ match: after, file: '', tags: null });
    }

    return out;
};