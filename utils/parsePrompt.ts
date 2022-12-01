const prompt_regex = /((__|<)(.*?)(__|>))/g;
const tags_regex = /(?<=\[)(.*?)(?=\])/g;

export const parsePrompt = (prompt: string) => {
    return prompt.match(prompt_regex)?.map((match) => {
        const file = match.split('|')[0].replaceAll('<', '').replaceAll('__', '');
        const tags = match.match(tags_regex);
        return { match, file, tags };
    });
};