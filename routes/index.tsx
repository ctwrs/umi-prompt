import { asset, Head } from "$fresh/runtime.ts";
import Counter from "../islands/Main.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Fresh App</title>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
      <a href={asset('umi/wildcards/Colors.txt')}>View brochure</a>
        {/* <Main /> */}
      </div>
    </>
  );
}
