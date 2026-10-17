<script lang="ts">
  import InfoPage from "#lib/components/InfoPage.svelte";

  const card = "rounded-2xl bg-white p-5 shadow-sm";
  const link = "font-semibold text-accent-dark underline underline-offset-2";
</script>

<InfoPage
  title="About"
  lede="Free classroom timers for the projector, starting with a pie timer that splits time into labelled parts students can see."
>
  <section class={card} aria-labelledby="community-title">
    <div class="flex items-center gap-3">
      <img src="/teacher-dev-logo.svg" alt="" width="40" height="40" />
      <h2 id="community-title" class="text-lg font-bold">From teacher.dev</h2>
    </div>
    <p class="mt-3 leading-relaxed text-slate-700">
      Timer Toolbox is a project from
      <a class={link} href="https://teacher.dev" target="_blank" rel="noopener"
        >teacher.dev</a
      >, a community of builders making free tools for classrooms. Learn more
      about who we are and what else we're building at
      <a class={link} href="https://teacher.dev" target="_blank" rel="noopener"
        >teacher.dev</a
      >.
    </p>
    <figure
      class="mx-auto mt-6 w-full max-w-md -rotate-1 rounded-sm bg-white p-3 pb-5 shadow-lg ring-1 ring-slate-200"
    >
      <img
        src="/teacher-dev-2026.jpg"
        alt="The teacher.dev community in 2026"
        class="block w-full bg-slate-100"
      />
      <figcaption
        class="pt-4 text-center font-['Segoe_Script','Bradley_Hand','Snell_Roundhand','Comic_Sans_MS',cursive] text-lg text-slate-600"
      >
        EdTech-a-thon 2026
      </figcaption>
    </figure>
  </section>

  <section class={card} aria-labelledby="promise-title">
    <h2 id="promise-title" class="text-lg font-bold">Our promise</h2>
    <ul class="mt-3 grid gap-2 font-bold text-slate-800">
      <li class="flex items-center gap-3">
        <span class="size-2 rounded-xs bg-accent" aria-hidden="true"></span>
        Zero paywalls.
      </li>
      <li class="flex items-center gap-3">
        <span class="size-2 rounded-xs bg-accent" aria-hidden="true"></span>
        Zero ads.
      </li>
      <li class="flex items-center gap-3">
        <span class="size-2 rounded-xs bg-accent" aria-hidden="true"></span>
        Zero tracking of personal data.
      </li>
    </ul>
  </section>

  <section class={card} aria-labelledby="feedback-title">
    <h2 id="feedback-title" class="text-lg font-bold">Feedback &amp; ideas</h2>
    <p class="mt-2 leading-relaxed text-slate-700">
      We'd love to hear from you. Tell us what's working, what's not, or the
      kind of timer you wish you had for your class.
    </p>
    <a
      href="mailto:support@teacher.dev?subject=Timer%20Toolbox%20feedback"
      class="mt-4 inline-flex min-h-12 items-center rounded-full bg-accent px-5 font-semibold text-white active:bg-accent-dark"
    >
      Email support@teacher.dev
    </a>
  </section>
</InfoPage>
