---
title: "Wiring Document AI to Your Own Model Endpoint"
seoTitle: "Document AI on a Private Model Endpoint | ShimoDocs"
description: "The model endpoint is the trust boundary for document AI. What running one inside your network actually decides, from latency to egress review."
layout: feature
category: ai
date: 2026-09-17
tags: [ai, self-hosting, inference, networking]
keywords: "private AI endpoint, self-hosted AI model, document AI data flow"
---

An AI feature in a document suite presents itself as a button. Draw the document AI data flow behind it and it becomes something else: text taken from a document, assembled into a request, sent to a model endpoint, and a completion returned to the editor.

Once that path is on a whiteboard, the endpoint stops being a configuration detail. It is the trust boundary of the feature. Every question a reviewer will ask — what leaves the cluster, who can read it afterwards, what happens when it stops answering — resolves at that hop rather than at the button.

So the useful question is not which model is best. It is who operates the thing on the other end of the request, and whether that party is named somewhere in your organisation.

```keypoints
title: What you are deciding before you configure anything
- **The endpoint needs an owner, not a URL.** A base URL and an API key are a connection. Someone still has to answer for uptime, model changes and upgrades.
- **Streaming is a requirement, not a preference.** The suite always sends `stream: true`. A provider that cannot stream fails the request rather than degrading it.
- **Nothing fails over for you.** Several models can be configured, but there is no priority order between them and no automatic switch when the default model is unavailable.
- **Inference hardware is a separate purchase.** The documented server sizes describe the suite. A model server adds its own memory and accelerator on top.
- **The egress rule is the control.** Which addresses the cluster may reach, and on which ports, is what a security review can actually inspect.
```

## What an AI feature is once you draw the data flow

Follow one request. A writer selects a paragraph and asks for a rewrite, or asks a question that needs a passage retrieved from a file. The suite assembles the text, addresses it to the configured base URL, and authenticates with the API key stored beside it. A completion comes back and lands in the editor.

Three of those steps happen inside your cluster. The third one is the question.

```figure
type: flow
title: The document AI data flow
items: Document content | Prompt assembly | The model endpoint | The completion
detail: The file, the selection, or a passage the assistant was allowed to read | Text packaged into one request, addressed to whatever the suite was configured with | A server inside your network, a contracted vendor, or nothing at all | Text returned to the editor, where it is shown, used, or written back
caption: Figure 1. Three of the four steps stay inside your cluster. The third is the only one you have to be able to name, and the only one a reviewer will ask about.
```

That is the entire feature. Everything else — the model name, the context window, whether images are accepted — is a property of the far end. Which is why "we enabled AI" is not an answer to "what did we buy".

```callout
tone: warning
title: The provider has to stream
ShimoDocs always sends `stream: true` when it calls the model provider. A gateway or self-hosted server that answers only with a single complete response will fail the request. Confirm streaming works before you announce that an endpoint is compatible.
```

## The realistic options, and what each decides for you

The configuration asks for four things for a base model: a provider, a request URL, an API key and a default model. It does not say where the server is, who operates it, or what happens to the text afterwards. The choice between these options decides whether you have a private AI endpoint or a vendor relationship with an address.

**A model server inside your own network.** You run the endpoint. The documentation notes that local deployments such as vLLM and Ollama support the Responses protocol, so this is a supported shape rather than a workaround. You decide the model, the version and the hardware, and you inherit all three. Nothing about a prompt leaves the network.

**A vendor endpoint you have contracted.** A hosted model API reached over the public internet, with a data processing agreement and a retention answer attached. Document text leaves your cluster, and the far side is governed by contract rather than by your own policy. For low-sensitivity workspaces this is often the right answer. The endpoint is still the boundary; you have delegated its operation, not the responsibility for it.

**A hosted consumer model you have ruled out.** No agreement, no retention commitment, and terms that may allow content to be used for training. The exclusion is rarely enforced technically: if egress permits any address, a user with configuration access can point the suite at one. The rule has to live in the network policy, not in a guideline.

**No endpoint at all.** No configured model means no AI features. That is a legitimate configuration rather than a missing one.

One constraint sits across all four. Only the OpenAI Responses API protocol is supported, and the older chat completions endpoint is explicitly not. A gateway that exposes only that path will not work, however capable the model. Provider selection is not cosmetic: it can determine the request format, authentication method and response parsing.

Embeddings are a separate configuration with their own base URL, key, model and dimension. They are optional, and the cost of skipping them is specific: without embeddings, document content is never vectorised and the assistant cannot answer questions drawn from a knowledge base. If retrieval is the feature you want, embeddings are not the optional part.

```figure
type: layers
title: What you own when the model server is yours
items: Your network boundary | The AI gateway address | The model server | The model weights
detail: The egress rule, the firewall entry and the certificate — the layer a reviewer can see | Base URL, API key and default model, set in the operations platform | A server that speaks the Responses protocol and streams | The artifact that decides capability, memory footprint, and how often you upgrade
caption: Figure 2. Each layer inward is one more thing you operate. A contracted vendor endpoint collapses the last three into an agreement, which is cheaper to run and harder to evidence.
```

```pullquote
The endpoint is the trust boundary. Every claim you can make about your document AI is a property of that hop.
```

## Latency is a product decision, not an ops detail

An assistant that answers in two seconds is a different feature from one that answers in twenty. At two seconds, people use it while writing. At twenty, they start a request and leave, or they stop asking.

Four things decide the wait, and only one of them is the model.

- **Distance to the endpoint.** A round trip inside the same network is short and predictable. A vendor endpoint across the public internet adds variable time to every request, and the variance is worse than the average.
- **Streaming.** Streaming shows the first words while the rest is still generating. Without it, the user waits for the whole completion before seeing anything.
- **Retrieval.** A knowledge-base answer embeds the query, searches, and only then calls the model — a hop before the model is involved at all.
- **Model size.** A larger model on fixed hardware produces tokens more slowly. Quality per token goes up; the time to a useful answer may not.

If the endpoint is on the other side of the world from its users, no amount of prompt discipline fixes the round trip. That is one honest argument for an internal model server even when a vendor's model scores better on a benchmark: the distance is part of the feature, and people notice it before they notice quality.

Measure the wait from where people sit, with the documents they actually use. A number taken beside the server is not what the user sees.

## Sizing inference hardware separately from the suite

The system requirements are precise about what the suite needs, and they are worth reading as a boundary rather than a suggestion. A single node is 16 cores, 32 GB of memory, a 100 GB root partition and a 300 GB data disk mounted at `/data`, for teams of fewer than 200 people. A cluster is three or more servers with the same per-node specification, and disk targets are 5,000 mixed read/write IOPS, 150 MB/s sequential throughput and around 5 ms latency.

None of that is inference capacity, because every AI setting points at a model service you provide. If you choose a self-hosted AI model, you are sizing a second system — memory and accelerator for the weights, plus headroom for however many requests your users generate at once. Installing that server on the node that runs the suite is a way to make both slow.

Two questions decide most of the sizing. How large a model the work needs, which you can only answer by testing your own documents against candidates. And how many concurrent requests you expect, which follows from how many people use the assistant and how long they are willing to wait.

One detail belongs in procurement rather than operations: the context window configured for a model interacts with the model's real capacity. Set it larger than the model can handle and requests fail; too small and content is truncated or cannot be submitted. The disagreement shows up in production.

## The network path, and why this lands in egress review

The deployment opens a documented set of ports: the installer on `18080`, user access on `80` or `443`, SSH on `22`, and the middleware ports for MySQL, Redis, MongoDB, Kafka, Elasticsearch and object storage. A model endpoint is not on that list. It arrives with its own address, port and certificate, and it needs its own rule. That is the moment the AI feature stops being a product decision and becomes a change to the network.

If the endpoint sits inside the same network, the rule is narrow and the review is short: this cluster may reach this address on this port, and nothing else on that path.

If the endpoint belongs to a vendor, the rule points outward and the review becomes a set of questions about retention, training and access — the ones in [our checklist for AI agents in documents](/blog/ai-agents-in-documents-security). The configuration guide sees the same surface from the other side: when a model call fails, the documented causes are the address, the network, the certificate and the firewall policy.

```figure
type: bars
title: Bandwidth by user count, before inference is counted
items: 100 users | 200 users | 500 users
value: 25 | 50 | 125
detail: 25 Mbps | 50 Mbps | 125 Mbps
caption: Figure 3. The documented estimate is 0.25 Mbps per user, and the guide says to apply the same standard to inbound, outbound and load balancing for internal access. That number was written for document traffic. Prompt and completion traffic is a new line on the same budget.
```

The documented estimate is a starting point, not a ceiling. An assistant used all day sends far more than an opened document and a batch of keystrokes, and if the endpoint is remote, every request crosses the same link. Budget it, or discover it during an incident.

## When the endpoint is unavailable, and when to leave AI off

The configuration guide is direct: the suite does not switch to another model when the default is unavailable. If the endpoint stops answering, the AI features fail. There is no fallback provider and no queue for later.

That makes availability a design decision rather than a property you inherit. Three things are worth settling first.

- **What the user sees.** A failed request that says so is worth more than a spinner that never resolves. Verify it yourself — the guide's instruction is to test each function individually rather than trusting the enabled status on the page.
- **What keeps working.** Documents, editing, comments and history do not depend on the endpoint. The failure stays bounded to the AI features only if they were never wired into saving, sharing or opening a file.
- **Who operates the far side.** Who restarts the server, how an upgrade is scheduled, and whether a model version change is announced. If the model behind the endpoint changes silently, the tone of every draft changes with it.

There is a case for running without AI features for a while, and it is stronger than a procurement document usually admits. Do not enable it if nobody will own the endpoint, if the content that would be sent to it has not been classified, if the egress path cannot survive the security review, or if the people asking for it cannot describe the task it is for. None of those are permanent states, and the suite works without any of it.

A pilot answers the open questions cheaply. Take one workspace with low-sensitivity content, configure one endpoint, and run it for a month. What you learn is whether the latency is acceptable to the people doing the work, whether the model is good enough on your documents, and whether the endpoint has an owner. Those three answers decide the rollout.

When you are ready to configure it, the [deployment documentation](/docs) carries the field-by-field reference and the checks to run afterwards. What to secure once the endpoint exists is in [the AI agents checklist](/blog/ai-agents-in-documents-security); what happens to text after it leaves is in [content control and AI training](/blog/ai-training-content-control); and the storage half of the same argument is in [key custody and encryption](/blog/byo-key-encryption-documents).
