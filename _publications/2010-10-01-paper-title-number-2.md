---
title: "Red Teaming Deep Neural Networks with Feature Synthesis Tools"
collection: publications
permalink: /publication/2010-10-01-paper-title-number-2
excerpt: 'We benchmark feature synthesis tools on their ability to discover vulnerabilities in deep neural networks'
date: 2023-12-10
venue: 'NeurIPS'
paperurl: 'https://arxiv.org/abs/2302.10894'
---

### Abstract

Interpretable AI tools are often motivated by the goal of understanding model behavior in out-of-distribution (OOD) contexts. Despite the attention this area of study receives, there are comparatively few cases where these tools have identified previously unknown bugs in models. We argue that this is due, in part, to a common feature of many interpretability methods: they analyze model behavior by using a particular dataset. This only allows for the study of the model in the context of features that the user can sample in advance. To address this, a growing body of research involves interpreting models using \emph{feature synthesis} methods that do not depend on a dataset. 
In this paper, we benchmark the usefulness of interpretability tools on debugging tasks. Our key insight is that we can implant human-interpretable trojans into models and then evaluate these tools based on whether they can help humans discover them. This is analogous to finding OOD bugs, except the ground truth is known, allowing us to know when an interpretation is correct. We make four contributions. (1) We propose trojan discovery as an evaluation task for interpretability tools and introduce a benchmark with 12 trojans of 3 different types. (2) We demonstrate the difficulty of this benchmark with a preliminary evaluation of 16 state-of-the-art feature attribution/saliency tools. Even under ideal conditions, given direct access to data with the trojan trigger, these methods still often fail to identify bugs. (3) We evaluate 7 feature-synthesis methods on our benchmark. (4) We introduce and evaluate 2 new variants of the best-performing method from the previous evaluation. 

[Download paper here](https://arxiv.org/abs/2302.10894)