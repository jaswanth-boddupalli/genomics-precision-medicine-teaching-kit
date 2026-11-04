"""
build_atlas_data.py - Extracts all 39 nodes, 10 layers, connections, keywords,
tools, companies, and content from genomics_to_precision_medicine_interactive_atlas_antigravity_spec.md
and outputs atlas_data.json and atlas_data.js.
"""

import re
import json

LAYER_CONFIG = {
    1: {"name": "Molecular & Biological Foundations", "color": "#3B82F6", "badge": "Layer 1", "icon": "🧬"},
    2: {"name": "Wet-Lab & Sequencing Technologies", "color": "#10B981", "badge": "Layer 2", "icon": "🧪"},
    3: {"name": "Multi-Omics, Single-Cell & Spatial Biology", "color": "#8B5CF6", "badge": "Layer 3", "icon": "🔬"},
    4: {"name": "Dry-Lab Bioinformatics & Pipeline Engineering", "color": "#F97316", "badge": "Layer 4", "icon": "💻"},
    5: {"name": "Tertiary Analysis, Databases & Clinical Standards", "color": "#EAB308", "badge": "Layer 5", "icon": "📊"},
    6: {"name": "AI, Deep Learning & Foundation Models", "color": "#EF4444", "badge": "Layer 6", "icon": "🤖"},
    7: {"name": "Healthcare Interoperability, ETL & Governance", "color": "#06B6D4", "badge": "Layer 7", "icon": "🏥"},
    8: {"name": "Translation to Precision Medicine (Clinical Specialties)", "color": "#EC4899", "badge": "Layer 8", "icon": "🩺"},
    9: {"name": "Precision Therapeutics (Acting on the Genome)", "color": "#14B8A6", "badge": "Layer 9", "icon": "💊"},
    10: {"name": "Commercial Ecosystem, Patents & Conferences", "color": "#94A3B8", "badge": "Layer 10", "icon": "🌐"}
}

NODE_LAYER_MAP = {
    "N01": 1, "N02": 1, "N03": 1, "N04": 1,
    "N05": 2, "N06": 2, "N07": 2, "N08": 2, "N09": 2, "N10": 2,
    "N11": 3, "N12": 3, "N13": 3, "N14": 3, "N15": 3,
    "N16": 4, "N17": 4, "N18": 4, "N19": 4,
    "N20": 5, "N21": 5, "N22": 5, "N23": 5,
    "N24": 6, "N25": 6, "N26": 6,
    "N27": 7, "N28": 7, "N29": 7,
    "N30": 8, "N31": 8, "N32": 8, "N33": 8, "N34": 8,
    "N35": 9, "N36": 9, "N37": 9,
    "N38": 10, "N39": 10
}

# Backbone connections from Mermaid in Part 2
MERMAID_EDGES = [
    # Layer 1
    ("N01", "N02"), ("N01", "N03"), ("N03", "N04"),
    # Layer 2
    ("N02", "N05"), ("N03", "N05"), ("N05", "N06"),
    ("N06", "N07"), ("N06", "N08"), ("N06", "N09"),
    ("N08", "N10"), ("N09", "N10"),
    # Layer 3
    ("N02", "N11"), ("N08", "N11"), ("N09", "N11"),
    ("N01", "N12"), ("N08", "N12"), ("N09", "N12"),
    ("N11", "N13"), ("N12", "N13"), ("N13", "N14"),
    ("N02", "N15"),
    # Layer 4
    ("N10", "N16"), ("N11", "N16"),
    ("N16", "N17"), ("N17", "N18"),
    ("N16", "N19"), ("N17", "N19"), ("N18", "N19"),
    # Layer 5
    ("N18", "N20"), ("N04", "N21"), ("N20", "N21"),
    ("N20", "N22"), ("N21", "N23"), ("N22", "N23"),
    # Layer 6
    ("N20", "N24"), ("N23", "N24"),
    ("N02", "N25"), ("N13", "N25"), ("N24", "N25"),
    ("N14", "N26"), ("N25", "N26"),
    # Layer 7
    ("N19", "N27"), ("N23", "N27"),
    ("N19", "N28"), ("N27", "N28"),
    ("N23", "N29"), ("N27", "N29"),
    # Layer 8
    ("N23", "N30"), ("N28", "N30"),
    ("N05", "N31"), ("N23", "N31"), ("N26", "N31"),
    ("N10", "N32"), ("N23", "N32"),
    ("N04", "N33"), ("N21", "N33"),
    ("N09", "N34"), ("N15", "N34"),
    # Layer 9
    ("N25", "N35"), ("N31", "N35"),
    ("N25", "N36"), ("N32", "N36"),
    ("N31", "N37"), ("N32", "N37"), ("N36", "N37"),
    # Layer 10
    ("N30", "N38"), ("N31", "N38"), ("N32", "N38"),
    ("N35", "N38"), ("N36", "N38"), ("N37", "N38"),
    ("N38", "N39")
]

def clean_markdown_text(text):
    """Clean markdown links and formatting for plain text display."""
    # Convert [Text](#anchor) -> Text
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    return text.strip()

def parse_spec_file():
    with open('genomics_to_precision_medicine_interactive_atlas_antigravity_spec.md', 'r', encoding='utf-8') as f:
        spec_text = f.read()

    # Split by #### NXX: Title
    node_pattern = r'####\s+(N\d{2}):\s+([^\n]+)'
    splits = re.split(node_pattern, spec_text)
    
    nodes = {}
    edges = set(MERMAID_EDGES)

    # splits[0] is preamble before N01
    for i in range(1, len(splits), 3):
        nid = splits[i].strip()
        title = splits[i+1].strip()
        body = splits[i+2].strip()

        layer_num = NODE_LAYER_MAP.get(nid, 1)
        layer_info = LAYER_CONFIG[layer_num]

        # Extract Core Concept
        core_concept_match = re.search(r'\*\s+\*\*Core Concept:\*\*\s*(.+?)(?=\n\*|\Z)', body, re.DOTALL)
        core_concept = core_concept_match.group(1).strip() if core_concept_match else ""

        # Extract Upstream from
        upstream_matches = re.findall(r'Upstream from:\s*([^\n]+)', body)
        upstream_nodes = []
        if upstream_matches:
            for up_str in upstream_matches:
                found = re.findall(r'N\d{2}', up_str)
                for f_id in found:
                    if f_id != nid:
                        upstream_nodes.append(f_id)
                        edges.add((f_id, nid))

        # Extract Downstream to
        downstream_matches = re.findall(r'Downstream to:\s*([^\n]+)', body)
        downstream_nodes = []
        if downstream_matches:
            for down_str in downstream_matches:
                found = re.findall(r'N\d{2}', down_str)
                for f_id in found:
                    if f_id != nid:
                        downstream_nodes.append(f_id)
                        edges.add((nid, f_id))

        # Extract technical keywords, tools, databases, companies
        # Using regex to find code spans `...`, bold names, and capitalized bio terms
        code_spans = re.findall(r'`([^`]+)`', body)
        # bold terms
        bold_terms = re.findall(r'\*\*([^*]+)\*\*', body)
        
        # Clean extracted keywords
        keywords = set()
        for k in code_spans:
            k_clean = k.strip()
            if 2 <= len(k_clean) <= 40 and not k_clean.startswith('http'):
                keywords.add(k_clean)
        for b in bold_terms:
            b_clean = re.sub(r':$', '', b.strip())
            if 2 <= len(b_clean) <= 45 and not b_clean.startswith('http') and not b_clean in ['Core Concept', 'How It Connects', 'Downstream to', 'Upstream from']:
                keywords.add(b_clean)

        # Categorize tools, databases, and companies
        tools = []
        companies = []
        
        # Specific known tools and company patterns
        tool_keywords = [
            'FASTQ', 'BAM', 'CRAM', 'VCF', 'gVCF', 'BCF', 'GATK', 'HaplotypeCaller', 'DeepVariant',
            'BWA-MEM2', 'STAR', 'Minimap2', 'Nextflow', 'WDL', 'Cromwell', 'Docker', 'Singularity',
            'Ensembl VEP', 'ANNOVAR', 'SnpEff', 'bcftools', 'SAMtools', 'Picard', 'Pysam', 'fgbio',
            'FastQC', 'MultiQC', 'fastp', 'Trimmomatic', 'Mosdepth', 'CNVkit', 'Manta', 'Sniffles2',
            'ExpansionHunter', 'TRGT', 'DeepSomatic', 'Mutect2', 'Strelka2', 'Cell Ranger', 'Seurat',
            'Scanpy', 'AnnData', 'Squidpy', 'Cellpose', 'DESeq2', 'Salmon', 'QIIME 2', 'Kraken2',
            'MetaPhlAn', 'PLINK', 'REGENIE', 'PRS-CS', 'LDpred2', 'AlphaFold', 'AlphaFold 3',
            'AlphaMissense', 'ESM3', 'ESM-2', 'Evo 2', 'Evo', 'SpliceAI', 'Enformer', 'Borzoi',
            'UNI', 'Virchow', 'CONCH', 'OpenRefine', 'TileDB', 'Hail', 'PharmCAT', 'OptiType',
            'SigProfiler', 'ScarHRD', 'Exomiser', 'LIRICAL', 'VariantValidator', 'hap.py', 'Truvari'
        ]

        standards_databases = [
            'gnomAD', 'ClinVar', 'COSMIC', 'OncoKB', 'OMIM', 'HPO', 'ClinGen', 'CPIC', 'PharmGKB',
            'PharmVar', 'MANE', 'HGVS', 'T2T-CHM13', 'GRCh38', 'GRCh37', 'HPRC', 'UK Biobank',
            'All of Us', 'GenomeIndia', 'GIAB', 'TCGA', 'cBioPortal', 'DECIPHER', 'Orphanet',
            'HL7', 'FHIR Genomics', 'GA4GH', 'VRS', 'Phenopackets', 'Beacon v2', 'OMOP CDM',
            'LOINC', 'SNOMED CT', 'MONDO', 'RxNorm', 'CLIA', 'CAP', 'FDA CDx', 'HIPAA', 'GDPR',
            'PGS Catalog', 'CARD', 'GISAID', 'Nextstrain'
        ]

        company_names = [
            'Illumina', 'Pacific Biosciences', 'PacBio', 'Oxford Nanopore', 'ONT', 'Element Biosciences',
            'Ultima Genomics', 'MGI', 'Complete Genomics', 'Thermo Fisher Scientific', 'Bionano Genomics',
            'Twist Bioscience', 'IDT', 'Agilent', 'Qiagen', 'New England Biolabs', 'NEB', 'Roche',
            'Watchmaker Genomics', 'Covaris', 'Streck', '10x Genomics', 'Bruker', 'NanoString',
            'Vizgen', 'Akoya Biosciences', 'Parse Biosciences', 'Scale Biosciences', 'BD', 'Olink',
            'SomaLogic', 'Quantum-Si', 'Nautilus Biotechnology', 'Guardant Health', 'Foundation Medicine',
            'Tempus AI', 'Natera', 'Exact Sciences', 'GRAIL', 'Caris Life Sciences', 'Personalis',
            'DELFI Diagnostics', 'Freenome', 'Foresight Diagnostics', 'SOPHiA GENETICS', 'GeneDx',
            'Labcorp', 'Invitae', 'Quest Diagnostics', 'Ambry Genetics', 'Myriad Genetics', 'Baylor Genetics',
            'Centogene', 'Blueprint Genetics', 'Fulgent Genetics', 'OneOme', 'Color Health', 'MedGenome',
            'Strand Life Sciences', 'Mapmygenome', '4baseCare', 'Seqera Labs', 'DNAnexus', 'Velsera',
            'Terra.bio', 'Lifebit', 'Genoox', 'Saphetor', 'Fabric Genomics', 'Golden Helix', 'Genomenon',
            'NVIDIA', 'AWS', 'Google DeepMind', 'Isomorphic Labs', 'EvolutionaryScale', 'Recursion',
            'Insitro', 'Schrödinger', 'Generate:Biomedicines', 'Chai Discovery', 'Cradle Bio', 'InstaDeep',
            'Xaira Therapeutics', 'Owkin', 'Paige AI', 'PathAI', 'CRISPR Therapeutics', 'Vertex',
            'Intellia Therapeutics', 'Beam Therapeutics', 'Prime Medicine', 'Verve Therapeutics',
            'Editas Medicine', 'Mammoth Biosciences', 'Tessera Therapeutics', 'Chroma Medicine',
            'Tune Therapeutics', 'Alnylam', 'Ionis', 'Sarepta', 'Moderna', 'BioNTech', 'Wave Life Sciences',
            'Epic Systems', 'Epic Aura', 'Cerner', 'Oracle Health', 'Bio-Rad'
        ]

        for t in tool_keywords:
            if t.lower() in body.lower():
                tools.append(t)
        for s in standards_databases:
            if s.lower() in body.lower() and s not in tools:
                tools.append(s)
        for c in company_names:
            if c.lower() in body.lower() and c not in companies:
                companies.append(c)

        # Extract formulas / LaTeX
        formulas = re.findall(r'\$\$([^\$]+)\$\$', body)
        if not formulas:
            inline_math = re.findall(r'\$([^\$]+)\$', body)
            # Filter for math with equations or symbols
            formulas = [m.strip() for m in inline_math if any(sym in m for sym in ['=', '>', '<', '\\', '^', '_', '\\log', '\\sum', '\\times'])][:3]

        nodes[nid] = {
            "id": nid,
            "title": title,
            "layer": layer_num,
            "layerName": layer_info["name"],
            "layerColor": layer_info["color"],
            "layerBadge": layer_info["badge"],
            "layerIcon": layer_info["icon"],
            "coreConcept": core_concept,
            "rawBody": body,
            "upstream": list(set(upstream_nodes)),
            "downstream": list(set(downstream_nodes)),
            "tools": list(dict.fromkeys(tools))[:15],
            "companies": list(dict.fromkeys(companies))[:12],
            "keywords": sorted(list(keywords))[:30],
            "formulas": formulas[:3]
        }

    # Reconcile all edges and ensure bidirectionality in node upstream/downstream lists
    edge_list = []
    edge_set = set()
    for src, dst in edges:
        if src in nodes and dst in nodes and (src, dst) not in edge_set:
            edge_set.add((src, dst))
            edge_list.append({
                "id": f"e_{src}_{dst}",
                "source": src,
                "target": dst
            })
            if dst not in nodes[src]["downstream"]:
                nodes[src]["downstream"].append(dst)
            if src not in nodes[dst]["upstream"]:
                nodes[dst]["upstream"].append(src)

    # Sort nodes by ID
    ordered_nodes = [nodes[k] for k in sorted(nodes.keys())]

    output_data = {
        "metadata": {
            "title": "The Complete Genomics to Precision Medicine Atlas",
            "subtitle": "Interactive Knowledge Graph, Conceptual Encyclopedia & Navigation Atlas",
            "totalLayers": 10,
            "totalNodes": len(ordered_nodes),
            "totalEdges": len(edge_list),
            "layers": LAYER_CONFIG
        },
        "nodes": ordered_nodes,
        "edges": edge_list
    }

    # Write to atlas_data.json
    with open("atlas_data.json", "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    # Write to atlas_data.js for direct script inclusion
    with open("atlas_data.js", "w", encoding="utf-8") as f:
        f.write("window.ATLAS_DATA = " + json.dumps(output_data, indent=2, ensure_ascii=False) + ";\n")

    print(f"SUCCESS: Generated atlas_data.json and atlas_data.js with {len(ordered_nodes)} nodes and {len(edge_list)} edges.")

if __name__ == "__main__":
    parse_spec_file()

