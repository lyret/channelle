# Channelle FAQ
[**What is Channelle?**](#what-is-channelle?)

[**Who is behind Channelle?7**](#who-is-behind-channelle? )

[**How does it work technically?7**](#how-does-it-work-technically? )

[**How does it work super-technically?**](#how-does-it-work-super-technically? )

[**Why do we need another communication service?9**](#why-do-we-need-another-communication-service? )

[**How can artists, cultural creators and activists use Channelle?**](#how-can-artists,-cultural-creators-and-activists-use-channelle? )

[**Why should you care what services you use on the internet?**](#why-should-you-care-what-services-you-use-on-the-internet? )

[**Open-source services serve a public purpose**](#open-source-services-serve-a-public-purpose)

--

## What is Channelle?  {#what-is-channelle?}

*Channelle is a tool for developing and making performing arts accessible in the service of society. Channelle is your local theatre house online. Channelle is open source, audience-friendly, and built with love for the performing arts.*

## Who is behind Channelle?  {#who-is-behind-channelle? }

Over the past five years, Skärmteatern (The Screen Theatre) has developed its own way of producing digitally mediated theatre performances. Skärmteatern’s shows emphasize live interaction with the audience. As an audience member, you’re often invited to chat, dance, play and follow the ensemble as they engage with the material in real time. Actors have a short preparation time to find items at home to support their portrayals and to decide how to present the story. The scripts are either newly written or adaptations of classics.
In the same spirit—working quickly, collaboratively, and with as much artistic freedom as possible—Skärmteatern also twice organized the streamed event Alternative Music Aid for Gaza, featuring over 50 artists.

Skärmteatern works long-term with sustainable and enjoyable production methods, both in their own projects and in collaborations.
Various tools and services for streaming have been tested over the years. Now, Skärmteatern is launching its own stage: Channelle. Channelle is a streaming tool developed by and for artists, built as open-source software and funded by Kulturbryggan (Swedish Arts Grants Committee).

Skärmteatern is run by directors Stina Kajaso and Ebba Petrén. The code is written by Viktor Lyresten from Maskinrepubliken, a group that develops tools for human interaction in the digital age—focusing on privacy-conscious, innovative and sustainable solutions.
With Channelle, the team wants to help create alternative digital spaces for art and make performing arts accessible to more people.

## How does it work technically?  {#how-does-it-work-technically? }

Channelle is a tool that allows users to create a “stage,” comparable to a video conferencing room like Zoom or Microsoft Teams.
Each stage is managed by at least one technician and allows actors to join behind the scenes while visitors experience a more guided performance.
Actors use the stage much like users of a standard video conferencing tool. They manage their own cameras and microphones, can view scripts, and collaborate with the technician and fellow performers.
Visitors experience a guided presentation but can also interact via text and audio when appropriate.
The technician controls how the stage is experienced, similar to a physical theatre setup—adding visual backgrounds, ambient sounds, and managing audio levels and camera layouts.
Channelle is built and released as open-source software and primarily uses open standards for video and data transmission. Open-source means anyone can read, audit, and run the code on their own devices without permission from the developer. No proprietary corporate code is used in its construction.
This means that anyone with a modern browser can use the tool regardless of device limitations or installation permissions.

## How does it work super-technically?  {#how-does-it-work-super-technically? }

Channelle consists of two main types of server software:
	•	The “theatre house” is a web server for static data and user data storage, used for creating stages.
	•	Each stage is a separate server (real or virtual), functioning as a Selective Forwarding Unit (SFU) for media transmission between users.
Benefits of this architecture include:
	•	Each stage can be created via a VPS provider and scaled appropriately for performance.
	•	Once a stage is no longer needed, the server can be deleted, reducing costs.
	•	During further development, only the stage or the theatre house can be redeployed independently. A stage can also be set up permanently if needed.

![./doc/architecture.png](./doc/architecture.png)

**Related research on this architecture:**
	•	https://dolby.io/blog/breaking-point-webrtc-sfu-load-testing/
	•	https://medium.com/@palak.tecsyssolutions/1-introduction-21f7719d10bb

## Why do we need another communication service?  {#why-do-we-need-another-communication-service? }

Channelle is funded by Kulturbryggan, a public fund supporting innovation in the arts, under Swedish Arts Grants Committee.
Projects funded with public money should benefit the public. Since Channelle is open and freely available, it becomes a tool for the people—designed to be accessible, sustainable, and free from the influence of corporate economic interests.
In a time when non-commercial meeting spaces—both physical and digital—are under threat, the development of tools like Channelle is vital.

What does Channelle offer that Zoom, Restream, or YouTube don’t? Channelle’s features are tailored for artistic production and were developed with public funding. The goal is to create something that supports autonomy and creative freedom. The design, graphics, and surrounding framework are built for those with an artistic purpose to feel at home.
Other platforms are either built for structured video meetings (like Zoom, which limits freedom), or for large-scale livestreaming for passive audiences (like Twitch, Restream, or YouTube). Channelle is compatible with other open-source tools like OBS Studio.
The goal is for the tool to be affordable, accessible, and uplifting in its design. Skärmteatern isn’t aiming to take over the world—we just want to create a neighborhood theatre online. We’re reaching out to those who share our vision as performers or audience members, and we aim for our entire operation to reflect our values, aesthetics, and inclusive tone.
Channelle fosters a sense of presence and community that is often missing in today’s livestreaming services, where audiences can feel disconnected and unable to participate.
You can also attend a presentation or lecture via Channelle without fear that your mic or camera will unexpectedly turn on or replace the presenter’s stream.

## How can artists, cultural creators and activists use Channelle?  {#how-can-artists,-cultural-creators-and-activists-use-channelle? }

Mainly in two ways:
	1	Self-host a copy of the software and run your own online theatre.
	2	Stream under the Skärmteatern umbrella.
Open-source software allows anyone with the right skills to set up their own version of Channelle—making it harder for commercial or state actors to censor or block online meetings.
You can also use Channelle to stream performances, lectures, or other events under Skärmteatern’s umbrella. If you’re an artist, cultural worker, or activist with a performance, idea, or presentation you'd like to stream, reach out to us.
A key point: creators retain control over their material. No one profits from your work without your consent. No one can delete or restrict access to it.
There are also opportunities to adapt the tool to different network restrictions (e.g., state censorship). Since we own the platform, we avoid many of the unwanted limitations that commercial platforms impose. On commercial platforms, creators can suddenly be censored simply because a company decided their content is “inappropriate.”

## Why should you care what services you use on the internet?  {#why-should-you-care-what-services-you-use-on-the-internet? }

Over the past two decades, internet use has rapidly changed—with smartphones, faster broadband, and real-time content and collaboration becoming the norm.
Simultaneously, the internet has become dominated by a few global tech giants who control communication, media distribution, and social interaction. These platforms are now crucial for democracy and cultural expression, but their monopolization poses serious threats.
Centralization creates dependency on a few major companies, reducing choice and increasing vulnerability—especially concerning availability, platform changes, and information control. Users lose control over their data and content. Eventually, it becomes nearly impossible to opt out, even if platforms violate labor rights or privacy.
Commercialization also squeezes out non-commercial culture.

## Open-source services serve a public purpose {#open-source-services-serve-a-public-purpose}

 Open-source programs—i.e., software with free and public source code—can be audited by experts. Security flaws, misuse of personal data, or unethical algorithms can be identified and addressed.
Free source code means anyone can continue developing a program even if the original developers can’t—ensuring that the work isn’t lost and no single actor can shut it down.
By developing, using, and promoting alternative open-source services, we fight centralization and guarantee free access to communication—enabling human and cultural interaction without censorship.
