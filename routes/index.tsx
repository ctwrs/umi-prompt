import { Head } from "$fresh/runtime.ts";
import Main from "../islands/Main.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Umi Prompt</title>
      </Head>
      <div class="p-4">
        <Main prompt="" />
      </div>
    </>
  );
}
