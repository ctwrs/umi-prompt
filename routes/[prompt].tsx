import { Head } from "$fresh/runtime.ts";
import Main from "../islands/Main.tsx";

import { PageProps } from "$fresh/server.ts";

export default function Home(props: PageProps) {
  const prompt = props.params.prompt;

  return <Main prompt={prompt} />;
}
