---
title: "Forbidden Facts: An Investigation of Competing Objectives in Llama-2"
collection: publications
permalink: /publication/2015-10-01-paper-title-number-3
excerpt: 'We use mechanistic interpretability tools to try to understand how LLMs reconcile conflicting objectives.'
date: 2023-12-16
venue: 'NeurIPS 2023 ATTRIB and SoLaR Workshops'
paperurl: 'https://arxiv.org/abs/2312.08793'
---
### Abstract

LLMs often face competing pressures (for example helpfulness vs. harmlessness). To understand how models resolve such conflicts, we study Llama-2-chat models on the forbidden fact task. Specifically, we instruct Llama-2 to truthfully complete a factual recall statement while forbidding it from saying the correct answer. This often makes the model give incorrect answers. We decompose Llama-2 into 1000+ components, and rank each one with respect to how useful it is for forbidding the correct answer. We find that in aggregate, around 35 components are enough to reliably implement the full suppression behavior. However, these components are fairly heterogeneous and many operate using faulty heuristics. We discover that one of these heuristics can be exploited via a manually designed adversarial attack which we call The California Attack. Our results highlight some roadblocks standing in the way of being able to successfully interpret advanced ML systems.

[Download paper here]https://arxiv.org/abs/2312.08793)