# 🧬 Genomics & Precision Medicine Interactive Teaching Kit & Interview Arena
### *A Visual Knowledge Graph Atlas, Multi-Persona Interview Simulator & Educational Roadmap for Beginners and Aspiring Bioinformaticians*

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://genomics-precision-medicine-teaching-kit.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web_/_PC_/_Mobile-6366f1?style=for-the-badge)](#mobile--pc-responsive-design)
[![Questions](https://img.shields.io/badge/Interview_Questions-27_Curated-f59e0b?style=for-the-badge)](#the-interview-arena)

---

## 🌟 Overview

Welcome to the **Genomics & Precision Medicine Teaching Kit**! 

Translating patient biology into actionable clinical treatments involves a complex multi-disciplinary pipeline spanning molecular biology, high-throughput sequencing, high-performance computing, bioinformatics, statistical curation, and clinical medicine. For beginners, students, and job seekers entering bioinformatics, genomics, and clinical computational biology, understanding how all these moving pieces connect can feel overwhelming.

This open-source teaching kit was designed to bridge that gap. It combines:
1. **A 39-Node, 10-Layer Interactive Knowledge Graph Atlas** depicting the entire end-to-end translational pipeline.
2. **A Gamified 27-Question Multi-Persona Interview Arena** featuring *Chief Scientist*, *Bioinformatic Troubleshooter*, and *Biotech Investor* perspectives.
3. **A Split-Screen "Coach View"** that teaches you how interview questions connect to real-world laboratory and algorithmic components in real-time.
4. **Translational Pathfinder** to trace causal dependencies from tissue extraction to targeted therapies.
5. **Full PC and Mobile responsiveness** with touch gestures and pinch-to-zoom for learning on the go.

---

## 🗺️ The 10-Layer Translational Pipeline Architecture

The interactive map is divided into 10 biological and clinical layers representing how genomic data flows from patient to clinic:

```
[Layer 1: Biological Source & Extraction]
     ↓ (cfDNA, FFPE, Fresh Frozen, Germline WBC)
[Layer 2: Library Preparation & Target Enrichment]
     ↓ (Hybrid Capture, Amplicon, Enzymatic Fragmentation, UMIs)
[Layer 3: Sequencing Modalities & Hardware]
     ↓ (NovaSeq X, AVITI Short-Read, PacBio Revio HiFi, ONT PromethION)
[Layer 4: Primary & Secondary Bioinformatics]
     ↓ (Bcl2fastq, BWA-MEM2, DeepVariant, GATK HaplotypeCaller, Strelka2)
[Layer 5: Variant Annotation & Population Genetics]
     ↓ (Ensembl VEP, gnomAD, ClinVar, COSMIC, REVEL, SpliceAI)
[Layer 6: Somatic & Tumor Profiling]
     ↓ (TMB, MSI-H, Homologous Recombination Deficiency HRD, Subclonal Evolution)
[Layer 7: Clinical Interpretation & ACMG/AMP Tiering]
     ↓ (AMP/ASCO/CAP Tiers I-IV, ACMG/ClinGen 5-tier classification)
[Layer 8: Pharmacogenomics (PGx) & Therapeutic Actionability]
     ↓ (CPIC Guidelines, CYP2D6/CYP2C19, DPYD, TPMT, Targeted Inhibitors)
[Layer 9: Multi-Omic & Cell-Free Integration]
     ↓ (ctDNA MRD Liquid Biopsy, scRNA-seq, Spatial Transcriptomics)
[Layer 10: Clinical Delivery, EHR & Ethical Governance]
       (HL7/FHIR Genomics, GINA Non-Discrimination, CLIA/CAP Lab Quality)
```

---

## 🎮 The Multi-Persona Interview Arena

The Interview Arena prepares students and candidates for real-world interviews at top genomics institutes, biotech startups, and clinical diagnostic laboratories (e.g., Broad Institute, Illumina, Foundation Medicine, Grail, Guardant Health, Tempus).

### 3 Difficulty Tiers
- **🟢 Beginner**: Fundamental definitions, QC metrics (Phred Q30, depth vs. breadth, transition/transversion ratio), and basic pipeline mechanics.
- **🟡 Medium**: Benchmarking methodologies, pipeline troubleshooting, variant tiering nuances, and error correction.
- **🔴 Expert**: Subclonal deconvolution, low-frequency ctDNA noise filtration, mosaicism, regulatory compliance, and multi-gene PGx dosing algorithms.

### 3 Interviewer Personas
- **🔬 Chief Scientist / Laboratory Director**: Evaluates biological rigor, sample integrity, validation metrics, and molecular mechanisms.
- **🛠️ Bioinformatic Troubleshooter**: Tests debugging skills, FASTQ/BAM edge cases, PCR duplicate bias, mapping quality flags, and benchmark truth sets.
- **💼 Biotech Investor / CBO**: Focuses on unit economics (cost per gigabase), reimbursement codes (CPT/PAMA), turnaround times, and clinical utility.

### 🌟 Features Inside the Arena
- **Exemplary "Hire-Me" Answers**: Detailed sample responses formatted with **KaTeX** mathematical formulas (e.g., binomial distribution for somatic allele calls, VAF confidence intervals).
- **Red-Flag Pitfalls**: What *not* to say in an interview to avoid common candidate traps.
- **Linked Knowledge Nodes**: Instant jumps to related graph nodes to explore how concepts connect.
- **Boss Battle Simulations**: Multi-stage clinical scenarios (e.g., *The 0.2% ctDNA Paradox*, *Pediatric Exome Diagnostic Odyssey*).

---

## ⚡ Split-Screen "Coach View"

In **Coach View**, the interface divides into:
- **Left Panel (or Bottom on Mobile)**: The active interview question, difficulty badge, persona rubric, and expandable "Hire-Me" breakdown.
- **Right Panel (or Top on Mobile)**: The live visual knowledge graph automatically pans to, highlights, and traces the upstream inputs and downstream consequences of the active question.

---

## 📱 Mobile & PC Responsive Design

The application is built for seamless learning across all device form-factors:
- **Desktop / Laptop (PC / Mac / Linux)**:
  - Expansive fullscreen canvas with mouse pan, smooth zoom wheel, and keyboard shortcuts (`Esc` to toggle sidebar, `F` for fullscreen, `P` for pathfinder).
  - Side-by-side Coach mode layout.
- **Tablets & Smartphones (iOS Safari / Android Chrome)**:
  - Single-finger canvas pan and node selection.
  - Multi-touch **pinch-to-zoom** with gesture tracking.
  - Responsive vertical stacking in Coach mode (live graph preview on top, questions below).
  - Touch-optimized filter chips and drawer inspectors.

---

## 🚀 Quick Start (Local Setup)

No heavy build tools or npm dependencies are required to run the kit locally! It runs on native web technologies (HTML5, Vanilla ES6 JavaScript, HTML5 Canvas, KaTeX).

### Prerequisites
- Any modern web browser (Chrome, Edge, Firefox, Safari)
- Optional: Python 3 to serve files locally

### Running Locally

```bash
# Clone the repository
git clone https://github.com/jaswanth-boddupalli/genomics-precision-medicine-teaching-kit.git
cd genomics-precision-medicine-teaching-kit

# Start a lightweight local server (Python 3)
python -m http.server 8000

# Open in your browser
# Visit: http://localhost:8000
```

On Windows, you can also simply double-click `Genomics_Atlas.bat` to launch the local server and open your browser automatically.

---

## ☁️ Deployment on Vercel

This repository is pre-configured for instant zero-configuration deployment to [Vercel](https://vercel.com):

1. Fork or clone this repository to your GitHub account.
2. Go to [Vercel](https://vercel.com/new) and select **Import Git Repository**.
3. Select this repo and click **Deploy**.
4. Your personal live genomics teaching portal will be active in seconds!

---

## 📁 Repository Structure

```
├── index.html            # Main web application entry point & view container
├── styles.css            # Dark-mode biotechnology UI theme & responsive queries
├── app.js                # State management, view switcher, gamification, and event controller
├── graph_engine.js       # HTML5 Canvas 2D engine (force-directed, pipeline, touch controls)
├── atlas_data.js         # 39 nodes, 130 edges, 10 layers, metadata, and formulas
├── interview_data.js     # 27 curated interview questions, rubrics, and Hire-Me answers
├── atlas_data.json       # JSON export of the 39-node knowledge graph
├── interview_data.json   # JSON export of the 27 interview questions
├── vercel.json           # Vercel deployment and security header configuration
├── Genomics_Atlas.bat    # Windows desktop launcher script
├── Genomics_Atlas.sh     # Linux/macOS desktop launcher script
├── server.py             # Python HTTP server runner
└── README.md             # Teaching kit guide and documentation
```

---

## 📚 Curriculum & External Hubs Reference

This kit directly references and links to gold-standard genomic databases and consortia:
- [ClinVar](https://www.ncbi.nlm.nih.gov/clinvar/) - Human genetic variants and clinical significance
- [gnomAD](https://gnomad.broadinstitute.org/) - Genome Aggregation Database for allele frequencies
- [CPIC](https://cpicpgx.org/) - Clinical Pharmacogenetics Implementation Consortium guidelines
- [AlphaFold Database](https://alphafold.ebi.ac.uk/) - 3D protein structure predictions
- [ENCODE SCREEN](https://screen.encodeproject.org/) - Functional genomics & cis-regulatory elements
- [NCBI dbSNP](https://www.ncbi.nlm.nih.gov/snp/) - Single nucleotide polymorphism repository

---

## 🤝 Contributing

Contributions to improve question explanations, add new biological nodes, or translate content are warmly welcomed!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewGenomicsConcept`)
3. Commit your Changes (`git commit -m 'Add Spatial Transcriptomics interview question'`)
4. Push to the Branch (`git push origin feature/NewGenomicsConcept`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Crafted with precision for the next generation of bioinformaticians, geneticists, and precision oncology innovators.*
