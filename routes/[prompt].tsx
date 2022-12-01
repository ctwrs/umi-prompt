import { Head } from "$fresh/runtime.ts";
import Main from "../islands/Main.tsx";

import { PageProps } from "$fresh/server.ts";

export default function Home(props: PageProps) {

  const prompt = decodeURIComponent(props.params.prompt);

  return (
    <>
      <Head>
        <title>Umi Prompt: {prompt}</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <Main prompt={prompt} />
      </div>
    </>
  );
}
