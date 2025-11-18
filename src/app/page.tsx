"use client"

import type React from "react"

import { useState } from "react"
import { StreamViewer } from "@/components/stream-viewer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatRAGStreamData, parseRawToRAGStreamData, parseRawToObjects } from "@/lib/format-rag-stream"
import { Upload, FileJson, ArrowLeft, ArrowRight } from "lucide-react"

const DEFAULT_EXAMPLE = `data: {"event": "thinking_title", "content": "Retrieving data...", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:35.668293", "sequence": 1, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "memory_retrieval"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Memory Retrieval: Retrieving data...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:35.668458", "sequence": 2, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "memory_retrieval"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_title", "content": "Thinking...", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:35.668578", "sequence": 3, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "qna_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Qna Search: Thinking...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:35.668656", "sequence": 4, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "qna_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_title", "content": "Retrieving data...", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:39.303037", "sequence": 5, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "qna_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Qna Search: Retrieving data...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:39.303195", "sequence": 6, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "qna_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Qna Search: Searched: สัญญาณอุตสาหกรรมกำลังจะตาย, การระบุอุตสาหกรรมที่ถูกดิสรัปต์, ตัวชี้วัดอุตสาหกรรมเสื่อมถอย\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:39.303315", "sequence": 7, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "qna_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Qna Search: Found 9 Q&A entries covering: AC ของบริษัทจดทะเบียนจะเป็น AC ในบริษัทย่อยที่กำลั..., การแก้ไขเหตุเมื่อบริษัทเป็น Cash company โดยต้องมี..., บริษัทจะเข้าข่ายอาจถูกเพิกถอนเมื่อเป็น Cash compan...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:39.303391", "sequence": 8, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "qna_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "search_result", "content": {"query_text": "สัญญาณอุตสาหกรรมกำลังจะตาย, การระบุอุตสาหกรรมที่ถูกดิสรัปต์, ตัวชี้วัดอุตสาหกรรมเสื่อมถอย", "action": "qna_search", "results": [{"id": "823491dee1dcbf27ddd11ade619a31ca", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/set-atlas-dev-qna_1752573360569/branches/0/documents/823491dee1dcbf27ddd11ade619a31ca", "id": "823491dee1dcbf27ddd11ade619a31ca", "struct_data": {"question": "การแก้ไขเหตุเมื่อบริษัทเป็น Cash company โดยต้องมีธุรกิจหลักที่จะประกอบไปได้อย่างต่อเนื่องชัดเจน จะพิจารณาอย่างไร", "answer": "มีรายได้จากการดําเนินงาน มีทรัพย์สินที่ใช้ประกอบธุรกิจหลักหรือได้รับ ใบอนุญาตหรือสัมปทานในการประกอบธุรกิจนั้นซึ่งอยู่ระหว่างดำเนินการเพื่อให้เกิดรายได้จากการดําเนินงาน เป็นต้น\n ข้อมูลข้างต้นเป็นตัวอย่างการพิจารณา แต่เนื่องจากธุรกิจของแต่ละบริษัทมีความหลากหลาย จึงอาจมีปัจจัยในการพิจารณาที่แตกต่างกันดังนั้นจึงขอให้นำรายละเอียดหารือกับทาง ตลท โดยตรง", "hint": "Consider the criteria for a company to demonstrate a clear and continuous core business when addressing a \"Cash company\" status. The answer should include examples of factors like operational revenue, business assets, or licenses/concessions, and acknowledge the potential for diverse considerations requiring direct consultation."}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(embedding)": {"values": [0.5930725336074829]}}}, {"id": "021cb011dcee598900015a3051fa189f", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/set-atlas-dev-qna_1752573360569/branches/0/documents/021cb011dcee598900015a3051fa189f", "id": "021cb011dcee598900015a3051fa189f", "struct_data": {"question": "บริษัทจะเข้าข่ายอาจถูกเพิกถอนเมื่อเป็น Cash company ทันทีเลยหรือไม่", "answer": "ไม่ได้เกิดขึ้นทันที ตลท ให้เวลาแก้ไข 6 เดือนหลังจากได้รับรายงานแสดงฐานะการเงิน โดยจะขึ้นเครื่องหมาย CC ไว้ แต่เมื่อบริษัทจดทะเบียนและ/หรือบริษัทย่อยมีลักษณะเป็น Cash Company เกินกว่า 6 เดือนนับแต่ วันที่ตลาดหลักทรัพย์ได้รับรายงานแสดงฐานะการเงินหลังจากที่มีการจําหน่ายสินทรัพย์ทั้งหมดหรือเกือบหทั้งหมดซึ่งผ่านการสอบทานจากผู้สอบบัญชีแล้ว ตลท จะประกาศเข้าข่ายอาจถูกเพิกถอน และขึ้นเครื่องหมาย NC (Non-Compliance) และ SP (Suspension) เพื่อสั่งห้ามซื้อขายหลักทรัพย์", "hint": "Investigate the process and timeline for a company being classified as a \"Cash Company\" and the subsequent implications for potential delisting. The answer should detail the stages, including initial notifications, grace periods, and specific timeframes related to financial reporting and asset disposal that trigger different regulatory actions and trading restrictions."}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(embedding)": {"values": [0.583638072013855]}}}, {"id": "0a0f00b709e276876f31b94743a77cbb", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/set-atlas-dev-qna_1752573360569/branches/0/documents/0a0f00b709e276876f31b94743a77cbb", "id": "0a0f00b709e276876f31b94743a77cbb", "struct_data": {"question": "AC ของบริษัทจดทะเบียนจะเป็น AC ในบริษัทย่อยที่กำลังเตรียมตัว IPO ได้หรือไม่", "answer": "ไม่แนะนำ เนื่องจากจะทำให้ AC ขาดคุณสมบัติ ภายหลังบริษัทย่อยเข้าจดทะเบียนในตลท. เนื่องจากเกณฑ์คุณสมบัติ AC กำหนดว่า AC จะต้องไม่เป็นกรรมการของบริษัทใหญ่ บริษัทย่อย หรือบริษัทย่อยลำดับเดียวกันเฉพาะที่เป็นบริษัทจดทะเบียน", "hint": "Consider the qualifications for Audit Committee (AC) members in listed companies, specifically regarding their roles in subsidiaries preparing for IPO. The answer should address potential disqualifications based on relationships with parent companies, subsidiaries, or sister companies that are already listed."}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(embedding)": {"values": [0.5736031532287598]}}}, {"id": "839b37c9bdc5644d4270c8dc36e501a8", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/set-atlas-dev-qna_1752573360569/branches/0/documents/839b37c9bdc5644d4270c8dc36e501a8", "id": "839b37c9bdc5644d4270c8dc36e501a8", "struct_data": {"question": "ลักษณะธุรกิจของบริษัทที่มีการลงทุนในโครงการสาธารณูปโภคพื้นฐาน ที่สามารถยื่นเข้าจดทะเบียนใน ตลท ได้เป็นอย่างไร", "answer": "อ้างอิงนิยามตามเกณฑ์ ก.ล.ต. ว่าด้วยหลักเกณฑ์ เงื่อนไข และวิธีการจัดตั้งและจัดการกองทุนรวม หรือทรัสต์เพื่อการลงทุนในโครงสร้างพื้นฐาน ระบุว่า\n \"สาธารณูปโภคพื้นฐาน\" หมายถึง กิจการดังต่อไปนี้ \n 1.ระบบขนส่งทางราง หรือทางท่อ\n 2.ไฟฟ้า\n 3.ประปา \n 4.ถนนทางพิเศษ หรือทางสัมปทาน\n 5.ท่าอากาศยานหรือสนามบิน\n 6.ท่าเรือน้ำลึก\n 7.โทรคมนาคม หรือโครงสร้างพื้นฐานด้านเทคโนโลยีสารสนเทศและการสื่อสาร\n 8.พลังงานทางเลือก\n 9.ระบบบริหารจัดการน้ำ หรือการชลประทาน\n 10.ระบบป้องกันภัยธรรมชาติ ซึ่งรวมถึงระบบเตือนภัยและระบบจัดการ เพื่อลดความรุนแรงของภัยธรรมชาติที่เกิดขึ้นด้วย\n 11.ระบบจัดการของเสีย\n กิจการที่มีลักษณะเป็นกิจการโครงสร้างพื้นฐานตาม 1 ถึง 11 หลายกิจการ (multi-infrastructure) ประกอบกันโดยกิจการที่ประกอบกันเหล่านั้นเข้าลักษณะที่ครบถ้วนดังนี้ \n - มีความเชื่อมโยง ส่งเสริม หรือก่อให้เกิดประโยชน์ซึ่งกันและกัน หรือต่อชุมชนเดียวกันหรือใกล้เคียงกัน \n - ก่อให้เกิดหรือจะก่อให้เกิดรายได้เป็นมูลค่าไม่น้อยกว่าร้อยละแปดสิบของรายได้รวมของกิจการทั้งหมดที่ประกอบกันนั้น", "hint": "Search for the definition of \"infrastructure business\" as per SEC regulations for listing on the SET, specifically concerning investment in public utility projects. The answer should detail the types of eligible infrastructure activities and any additional criteria for multi-infrastructure businesses, including conditions related to interconnectedness and revenue contribution thresholds."}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(embedding)": {"values": [0.6039150357246399]}}}, {"id": "823491dee1dcbf27ddd11ade619a31ca", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/set-atlas-dev-qna_1752573360569/branches/0/documents/823491dee1dcbf27ddd11ade619a31ca", "id": "823491dee1dcbf27ddd11ade619a31ca", "struct_data": {"question": "การแก้ไขเหตุเมื่อบริษัทเป็น Cash company โดยต้องมีธุรกิจหลักที่จะประกอบไปได้อย่างต่อเนื่องชัดเจน จะพิจารณาอย่างไร", "answer": "มีรายได้จากการดําเนินงาน มีทรัพย์สินที่ใช้ประกอบธุรกิจหลักหรือได้รับ ใบอนุญาตหรือสัมปทานในการประกอบธุรกิจนั้นซึ่งอยู่ระหว่างดำเนินการเพื่อให้เกิดรายได้จากการดําเนินงาน เป็นต้น\n ข้อมูลข้างต้นเป็นตัวอย่างการพิจารณา แต่เนื่องจากธุรกิจของแต่ละบริษัทมีความหลากหลาย จึงอาจมีปัจจัยในการพิจารณาที่แตกต่างกันดังนั้นจึงขอให้นำรายละเอียดหารือกับทาง ตลท โดยตรง", "hint": "Consider the criteria for a company to demonstrate a clear and continuous core business when addressing a \"Cash company\" status. The answer should include examples of factors like operational revenue, business assets, or licenses/concessions, and acknowledge the potential for diverse considerations requiring direct consultation."}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(embedding)": {"values": [0.5841570496559143]}}}, {"id": "cf5eb3045d3e4161bdc75cbec4b27a9c", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/set-atlas-dev-qna_1752573360569/branches/0/documents/cf5eb3045d3e4161bdc75cbec4b27a9c", "id": "cf5eb3045d3e4161bdc75cbec4b27a9c", "struct_data": {"question": "บริษัททำธุรกิจผลิต ต้องนำเข้าวัตถุดิบจากต่างประเทศมาเพื่อใช้ผลิตสินค้า จึงมีการทำสัญญาซื้อขายสินค้าล่วงหน้ามูลค่า 41% ของสินทรัพย์รวม บริษัทจะถูกขึ้นเครื่องหมาย CC หรือไม่", "answer": "ไม่ เนื่องจากไม่เข้าข่าย investment company เป็นการซื้อสัญญาล่วงหน้าเพื่อประกอบธุรกิจหลัก ไม่ใช่เพื่อเก็งกำไร", "hint": "Consider the criteria for being designated as an \"investment company\" and how it relates to a company's primary business operations. The answer should clarify whether forward purchase contracts for raw materials, even if a significant percentage of total assets, are considered part of core business activities or speculative investments."}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(embedding)": {"values": [0.5595868229866028]}}}, {"id": "37ac329058d49d6ce9b37950fa27a8bb", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/set-atlas-dev-qna_1752573360569/branches/0/documents/37ac329058d49d6ce9b37950fa27a8bb", "id": "37ac329058d49d6ce9b37950fa27a8bb", "struct_data": {"question": "บริษัทมี free float น้อยกว่า 15% และถูกขึ้นเครื่องหมาย CF เมื่อ 4 มิถุนายน 2567 บริษัทต้องดำเนินการตามเกณฑ์อย่างไรบ้าง", "answer": "บริษัทต้องจัด public presentation ทุกไตรมาส เพื่อชี้แจงความคืบหน้าของการแก้ไข เพิ่ม free float ให้ถึง 15% หากไม่สามารถแก้ไขได้ภายใน 1 ปี นับจากวันที่ถูกขึ้น CF บริษัทจะถูกขึ้นเครื่องหมาย SP 1 ปี และรายงานความคืบหน้าการแก้ไขทุกไตรมาส หากยังไม่สามารถแก้ไข free float ให้ครบถ้วนได้ จะถูกประกาศเข้าข่ายอาจถูกเพิกถอนและถูกขึ้นเครื่องหมาย NC", "hint": "Search for the regulatory actions and reporting requirements for companies with insufficient free float, specifically those marked with \"CF\". The answer should detail the obligations, including presentation frequency, and the escalating consequences or additional markers if the free float issue is not resolved within specified timeframes."}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(embedding)": {"values": [0.6173555254936218]}}}, {"id": "8bf133fdc2a446fc8824bd6cefd99030", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/set-atlas-dev-qna_1752573360569/branches/0/documents/8bf133fdc2a446fc8824bd6cefd99030", "id": "8bf133fdc2a446fc8824bd6cefd99030", "struct_data": {"question": "บริษัทจดทะเบียนใน SET ต่อมาเข้าข่ายอาจถูกเพิกถอน ต้องพิจารณาคุณสมบัติกลับเข้าซื้อขายตามเกณฑ์ SET เท่านั้นหรือไม่", "answer": "ไม่จำเป็น เกณฑ์เปิดให้พิจารณาคุณสมบัติ ส่วนของผู้ถือหุ้น และกำไรสุทธิได้ทั้ง SET และ mai\n \n\n อ้างอิง ประกาศ คณะกรรมการตลาดหลักทรัพย์แห่งประเทศไทย เรื่อง แนวทางดำเนินการเพื่อแก้ไขเหตุแห่งการเพิกถอนหุ้นสามัญจากการเป็นหลักทรัพย์จดทะเบียน พ.ศ.2567 หน้า 13", "hint": "Consider the criteria for companies facing delisting from SET and whether their re-qualification is exclusively governed by SET rules. The answer should address if alternative market regulations or specific financial metrics, such as shareholder equity or net profit, can also be considered for re-entry."}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(embedding)": {"values": [0.6162834763526917]}}}, {"id": "83f83975482e44e74146a26a0a15e049", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/set-atlas-dev-qna_1752573360569/branches/0/documents/83f83975482e44e74146a26a0a15e049", "id": "83f83975482e44e74146a26a0a15e049", "struct_data": {"question": "Feasibility Study สำหรับยื่นเข้าจดทะเบียนด้วยเกณฑ์ Infrastructure Business ที่มีอายุเกิน 3 ปี ใช้ประกอบการยื่นคำขอได้หรือไม่", "answer": "ให้ที่ปรึกษาทางการเงินที่ร่วมยื่นคำขอให้ความเห็นเพิ่มเติมว่า Feasibility Study ของโครงการยังคงเป็นไปตามเอกสารดังกล่าว", "hint": "Consider the requirements for using a Feasibility Study for an Infrastructure Business applying for registration, specifically when the study is older than a certain timeframe. The answer should address whether such a study is acceptable and what additional conditions or endorsements might be necessary from financial advisors involved in the application."}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(embedding)": {"values": [0.6146994233131409]}}}], "execution_time": 3633}, "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:39.303455", "sequence": 9, "metadata": {"source": "tool_result", "timing": null, "tool": {"name": "qna_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_title", "content": "Didn't find on first try - expanding the search...", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:40.455809", "sequence": 10, "metadata": {"source": "rag_thinking", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_title", "content": "Thinking...", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:40.455999", "sequence": 11, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "web_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Web Search: Thinking...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:40.456070", "sequence": 12, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "web_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_title", "content": "Thinking...", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:40.456126", "sequence": 13, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "rag_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Rag Search: Thinking...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:40.456173", "sequence": 14, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "rag_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_title", "content": "Retrieving data...", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.042761", "sequence": 15, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "web_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Web Search: Retrieving data...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.042975", "sequence": 16, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "web_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Web Search: Searched: วิธีดูอุตสาหกรรมที่กำลังจะตาย, อุตสาหกรรมที่ถูกดิสรัปต์\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.043119", "sequence": 17, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "web_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Web Search: Found 1 WEB entries covering: ไม่พบข้อมูลที่เกี่ยวข้องจากโดเมนที่กำหนด...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.043202", "sequence": 18, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "web_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "search_result", "content": {"query_text": "วิธีดูอุตสาหกรรมที่กำลังจะตาย, อุตสาหกรรมที่ถูกดิสรัปต์", "action": "web_search", "results": [{"title": "", "summary": "ไม่พบข้อมูลที่เกี่ยวข้องจากโดเมนที่กำหนด", "source_url": [""], "related_content": ""}], "execution_time": 2394}, "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.043268", "sequence": 19, "metadata": {"source": "tool_result", "timing": null, "tool": {"name": "web_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_title", "content": "Retrieving data...", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.043443", "sequence": 20, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "rag_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Rag Search: Retrieving data...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.043526", "sequence": 21, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "rag_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Rag Search: Searched: ปัจจัยและสัญญาณบ่งชี้ล่วงหน้าของการเสื่อมถอยหรือการถูกดิสรัปต์ในอุตสาหกรรมต่างๆ ที่ระบุไว้ในเอกสารภายใน\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.043603", "sequence": 22, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "rag_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Rag Search: Found 4 RAG entries covering: 4.2 ให้คำอธิบายเชิงคาดการณ์ล่วงหน้าเกี่ยวกับปัจจัย..., จากเอกสารนี้ได้แสดงตัวอย่างการวิเคราะห์ปัจจัยภายใน...\n", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.043658", "sequence": 23, "metadata": {"source": "rag_thinking", "timing": null, "tool": {"name": "rag_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "search_result", "content": {"query_text": "ปัจจัยและสัญญาณบ่งชี้ล่วงหน้าของการเสื่อมถอยหรือการถูกดิสรัปต์ในอุตสาหกรรมต่างๆ ที่ระบุไว้ในเอกสารภายใน", "action": "rag_search", "results": [{"id": "6361969bd753b126a8ad176877b83cb0", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/regulation-dev_1762239379810/branches/0/documents/6361969bd753b126a8ad176877b83cb0", "id": "6361969bd753b126a8ad176877b83cb0", "struct_data": {"document_tag": "Disclosure", "created_at": "2025-11-04 13:10:30.839529 UTC", "priority": 2.0, "description": "", "document_name": "", "page_number": 0.0, "folder": "", "doc_id": "18f95ffe-d8e8-40dd-a265-3fc310c64066", "chunk_text": "จากเอกสารนี้ได้แสดงตัวอย่างการวิเคราะห์ปัจจัยภายในและภายนอกที่สำคัญ ซึ่งประกอบด้วย 11 ข้อดังนี้\n\nข้อที่ 1 คือ การเพิ่มหรือลดสินค้าและบริการ ซึ่งรวมถึงการพัฒนาผลิตภัณฑ์ใหม่ การขยายธุรกิจทั้งแนวนอนและแนวตั้ง การยกเลิกผลิตภัณฑ์หรือธุรกิจบางส่วน ที่มีผลต่อความสามารถในการแข่งขันของบริษัท โดยต้องวิเคราะห์เชิงเปรียบเทียบกับคู่แข่ง รวมถึงการวิจัยและพัฒนารูปแบบและคุณภาพสินค้า\n\nข้อที่ 2 คือ การรวมธุรกิจหรือกิจการ การยกเลิกหรือหยุดการดำเนินธุรกิจหรือกิจการ การขยายส่วนงาน การได้มาหรือจำหน่ายไปซึ่งสินทรัพย์ที่มีความสำคัญ การเปลี่ยนแปลงลักษณะการประกอบธุรกิจ หรือการมีพันธมิตรที่จะช่วยเพิ่มประสิทธิภาพในการดำเนินธุรกิจโดยรวมของบริษัท ทั้งนี้ ในกรณีของการรวมกิจการ ต้องพิจารณาว่าบริษัทมีอำนาจควบคุมการดำเนินงานมากน้อยเพียงใด และมีปัญหาจากความแตกต่างของวัฒนธรรมองค์กรหรือการจัดสายการบังคับบัญชาที่มีผลกระทบต่อผลการดำเนินงานหรือไม่\n\nข้อที่ 3 คือ การตลาดและการแข่งขัน ซึ่งรวมถึงการขยายฐานการตลาด ความรุนแรงของการแข่งขัน และการมีคู่แข่งขันรายใหม่ ที่มีผลต่อการเพิ่มขึ้นหรือลดลงของอัตราส่วนแบ่งตลาดของบริษัท โดยต้องวิเคราะห์ควบคู่ไปกับกลยุทธ์ทางการตลาดที่บริษัทเลือกใช้\n\nข้อที่ 4 คือ การเปลี่ยนแปลงกฎหมายหรือนโยบายของหน่วยงานรัฐ เช่น การเปิดเสรีทางการค้า การจำกัดการนำเข้าหรือส่งออก การกำหนดโควต้า การเปลี่ยนแปลงโครงสร้างอัตราภาษี และการควบคุมผลกระทบต่อสิ่งแวดล้อม ซึ่งทั้งหมดนี้มีผลต่อการกำหนดกลยุทธ์ในการแข่งขัน การกำหนดราคา และต้นทุนการดำเนินงาน\n\nข้อที่ 5 คือ อัตราแลกเปลี่ยนเงินตราระหว่างประเทศ และอัตราเงินเฟ้อ ที่มีผลต่อระดับราคารายได้ ต้นทุนขาย ค่าใช้จ่าย และกำไรจากการดำเนิน โดยต้องอธิบายผลกระทบของการเปลี่ยนแปลงของอัตราแลกเปลี่ยนเงินตราต่างประเทศ หรือภาวะเงินเฟ้อดังกล่าว\n\nข้อที่ 6 คือ แนวโน้มภาวะเศรษฐกิจและการเปลี่ยนแปลงของภาวะอุตสาหกรรม\n\nข้อที่ 7 คือ แนวโน้มการเปลี่ยนแปลงของอัตราดอกเบี้ย ราคาวัตถุดิบที่สำคัญ และราคาสินค้าและบริการที่สำคัญของบริษัท\n\nข้อที่ 8 คือ การสูญเสียลูกค้ารายใหญ่หรือ suppliers\n\nข้อที่ 9 คือ คดีความที่มีกับลูกค้าหรือ suppliers ที่สำคัญ\n\nข้อที่ 10 คือ การถูก sanction จากประเทศที่ตั้งของคู่ค้าหรือบริษัทคู่ค้า เป็นต้น\n\nข้อที่ 11 คือ การไม่ปฏิบัติตามกฎระเบียบที่เกี่ยวข้องกับการดำเนินธุรกิจของบริษัท ซึ่งอาจมีผลต่อการถูกสั่งพักการประกอบธุรกิจเป็นการชั่วคราวหรืออาจถูกเพิกถอนการประกอบธุรกิจ- 142 -", "document_hash": "2ed7ded23355e42ea8639322ed6bd3e4a406e1ec79a18f671138099cea04cb29", "permissions": "", "document_type": "", "document_gcs_uri": ""}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(chunk_embedding)": {"values": [0.790528416633606]}}}, {"id": "0d36987b5a1993755d13a9270a2afda2", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/regulation-dev_1762239379810/branches/0/documents/0d36987b5a1993755d13a9270a2afda2", "id": "0d36987b5a1993755d13a9270a2afda2", "struct_data": {"document_tag": "Disclosure", "created_at": "2025-11-04 13:10:30.839529 UTC", "priority": 2.0, "description": "", "document_name": "", "page_number": 0.0, "folder": "", "doc_id": "f92a0b96-35ef-4ab4-8e5a-6c070c13f281", "chunk_text": "4.2 ให้คำอธิบายเชิงคาดการณ์ล่วงหน้าเกี่ยวกับปัจจัยหรือเหตุการณ์ที่อาจส่งผลกระทบอย่างมีนัยสำคัญต่อฐานะการเงินหรือผลการดำเนินงาน ซึ่งรวมถึงปัจจัยภายนอก เช่น แนวโน้มเศรษฐกิจ การเปลี่ยนแปลงในสภาพแวดล้อมของตลาด/อุตสาหกรรม และปัจจัยภายใน เช่น นโยบาย กลยุทธ์ การบริหารจัดการ การเปลี่ยนแปลงข้อตกลงทางธุรกิจที่อาจมีผลกระทบต่อการดำเนินงานด้วย\n\nSEC Classification : ใช้ภายใน (Internal)\n- 18 -\n\nจากเนื้อหาที่ปรากฏบนหน้ากระดาษนี้ได้กล่าวถึงปัจจัยอื่นๆ เช่น แนวโน้มและผลกระทบต่อสิ่งแวดล้อมและสังคม ซึ่งรวมถึงการเคารพสิทธิมนุษยชนและธรรมาภิบาลที่ดีขององค์กร เพื่อประโยชน์ในการทำความเข้าใจและวิเคราะห์ทิศทางในอนาคตของบริษัทโดยนักลงทุน\n\nในกรณีที่บริษัทมีโครงการหรือการวิจัยและพัฒนาที่จะส่งผลกระทบต่อผลการดำเนินงานและฐานะทางการเงินในอนาคตอันใกล้ (ประมาณ 1 ปี) จะต้องมีการอธิบายรายละเอียดของโครงการหรือการวิจัยและพัฒนาดังกล่าว เช่น ลักษณะ การเปิดตัวผลิตภัณฑ์หรือการปรับปรุงผลิตภัณฑ์ ความคืบหน้า และผลกระทบที่อาจเกิดขึ้นต่อการดำเนินงานและฐานะทางการเงินของบริษัท", "document_hash": "8cb4124e07ebcbe3e7fe99af42d6d0045d5615ff14d55ccfb46e07b3427d0cad", "permissions": "", "document_type": "", "document_gcs_uri": ""}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(chunk_embedding)": {"values": [0.7733154892921448]}}}, {"id": "0650fd5371cb2a1b1ce4132874ce4624", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/regulation-dev_1762239379810/branches/0/documents/0650fd5371cb2a1b1ce4132874ce4624", "id": "0650fd5371cb2a1b1ce4132874ce4624", "struct_data": {"document_tag": "Disclosure", "created_at": "2025-11-04 13:10:30.839529 UTC", "priority": 2.0, "description": "", "document_name": "", "page_number": 0.0, "folder": "", "doc_id": "cf0e6300-6fb2-4dfe-a0f8-e7d33ff9ec56", "chunk_text": "4.2 ให้คำอธิบายเชิงคาดการณ์ล่วงหน้าเกี่ยวกับปัจจัยหรือเหตุการณ์ที่อาจส่งผลกระทบอย่างมีนัยสำคัญต่อฐานะการเงินหรือผลการดำเนินงาน ซึ่งรวมถึงปัจจัยภายนอก เช่น แนวโน้มเศรษฐกิจ การเปลี่ยนแปลงในสภาพแวดล้อมของตลาด/อุตสาหกรรม และปัจจัยภายใน เช่น นโยบาย กลยุทธ์ การบริหารจัดการ การเปลี่ยนแปลงในข้อตกลงทางธุรกิจที่อาจมีผลกระทบต่อการดำเนินงานด้วย\n\nการจัดประเภทโดย ก.ล.ต. : ใช้ภายใน (Internal)\n- 18 -\n\nจากเนื้อหาในส่วนนี้ได้อธิบายถึงปัจจัยอื่น ๆ ที่บริษัทควรเปิดเผย ซึ่งรวมถึงแนวโน้มและผลกระทบต่อสิ่งแวดล้อมและสังคม โดยครอบคลุมถึงการเคารพสิทธิมนุษยชนและธรรมาภิบาลที่ดี ทั้งนี้ก็เพื่อประโยชน์ในการทำความเข้าใจและวิเคราะห์ทิศทางในอนาคตของบริษัทโดยนักลงทุน\n\nในกรณีที่บริษัทมีโครงการหรือการวิจัยและพัฒนาที่คาดว่าจะส่งผลกระทบต่อผลการดำเนินงานและฐานะการเงินในอนาคตอันใกล้ ซึ่งหมายถึงประมาณ 1 ปี บริษัทจะต้องบรรยายรายละเอียดของโครงการหรือการวิจัยและพัฒนาอย่างชัดเจน ตัวอย่างเช่น ลักษณะของโครงการ การเปิดตัวผลิตภัณฑ์ใหม่ หรือการปรับปรุงผลิตภัณฑ์ที่มีอยู่ ความคืบหน้าของโครงการ และผลกระทบที่อาจเกิดขึ้นต่อการดำเนินงานและฐานะการเงินของบริษัท เพื่อให้นักลงทุนได้รับข้อมูลที่ครบถ้วนและสามารถประเมินสถานการณ์ได้", "document_hash": "8cb4124e07ebcbe3e7fe99af42d6d0045d5615ff14d55ccfb46e07b3427d0cad", "permissions": "", "document_type": "", "document_gcs_uri": ""}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(chunk_embedding)": {"values": [0.748296320438385]}}}, {"id": "a169fcedd53d74427f562680f5328f3a", "document": {"name": "projects/102009974668/locations/global/collections/default_collection/dataStores/regulation-dev_1762239379810/branches/0/documents/a169fcedd53d74427f562680f5328f3a", "id": "a169fcedd53d74427f562680f5328f3a", "struct_data": {"document_tag": "Disclosure", "created_at": "2025-11-04 13:10:30.839529 UTC", "priority": 2.0, "description": "", "document_name": "", "page_number": 0.0, "folder": "", "doc_id": "18f95ffe-d8e8-40dd-a265-3fc310c64066", "chunk_text": "(6) ปัจจัยหรือเหตุการณ์ที่จะมีผลต่อฐานะการเงินหรือการดำเนินงานในอนาคต (forward looking)\n\nส่วนนี้กำหนดให้ผู้จัดทำเอกสารต้องอธิบายปัจจัยภายนอกหรือปัจจัยภายใน รวมถึงเหตุการณ์ที่คาดว่าจะส่งผลกระทบต่อฐานะการเงินหรือการดำเนินงานในอนาคต (forward looking)\n\nในกรณีที่บริษัทมีโครงการหรือการวิจัยและพัฒนาที่คาดว่าจะส่งผลกระทบต่อผลการดำเนินงานและฐานะการเงินในอนาคตอันใกล้ (ประมาณ 1 ปี) บริษัทจะต้องอธิบายรายละเอียดของโครงการหรือการวิจัยและพัฒนาดังกล่าว เช่น ลักษณะของโครงการ ผลิตภัณฑ์ใหม่ หรือการปรับปรุงผลิตภัณฑ์เดิม ความคืบหน้าของโครงการ ผลกระทบที่อาจมีต่อผลการดำเนินงานและฐานะการเงิน รวมถึงอัตราผลตอบแทนที่บริษัทคาดว่าจะได้รับจากการลงทุนในโครงการนั้น ๆ ทั้งนี้ เพื่อป้องกันความสับสนของผู้ลงทุน โครงการที่จะเปิดเผยควรมีความแน่นอนในระดับหนึ่งก่อน ไม่ใช่เป็นโครงการที่กล่าวอ้างลอย ๆ ตัวอย่างเช่น ควรมีการตกลงทำบันทึกความเข้าใจในการร่วมลงทุนกับผู้ร่วมทุนแล้ว", "document_hash": "2ed7ded23355e42ea8639322ed6bd3e4a406e1ec79a18f671138099cea04cb29", "permissions": "", "document_type": "", "document_gcs_uri": ""}, "derived_struct_data": {"clearbox_escorer_score": 0.0, "snippets": [{"snippet": "No snippet is available for this page.", "snippet_status": "NO_SNIPPET_AVAILABLE"}], "can_fetch_raw_content": "true", "is_exact_match_query": 0.0}, "schema_id": "", "parent_document_id": ""}, "model_scores": {"dotProduct(chunk_embedding)": {"values": [0.7533916234970093]}}}], "execution_time": 3585}, "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:44.043705", "sequence": 24, "metadata": {"source": "tool_result", "timing": null, "tool": {"name": "rag_search"}, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_title", "content": "Found partial data - trying to give you most accurate answer", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:45.500784", "sequence": 25, "metadata": {"source": "rag_thinking", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "thinking_content", "content": "Thinking completed", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:27:45.501024", "sequence": 26, "metadata": {"source": "rag_thinking", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

: ping - 2025-11-18 05:27:46.595198

: ping - 2025-11-18 05:28:01.596687

data: {"event": "intermediate_chunk", "content": "สวัสดีค่ะ เพื่อให้เราสามารถประเมินได้ว่าอุตสาหกรรมใดกำลังจะถดถอย หรือกำลังจะถูกดิสรัปต์ (Disrupt) เราสามารถพิจารณาจากปัจจัยสำคัญทั้งภายในและภายนอกที่ส่งผลกระทบต่อการเติบโตและความยั่งยืนของธุรกิจในอ", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:03.772817", "sequence": 27, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "ุตสาหกรรมนั้นๆ ในระยะยาวได้อย่างมีนัยสำคัญค่ะ โดยสามารถสรุปปัจจัยหลักๆ ที่ควรพิจารณาได้ดังนี้:\n\n**1. ปัจจัยด้านเศรษฐกิจและโครงสร้างอุตสาหกรรม:**\n*   **ภาวะเศรษฐกิจถดถอยหรือชะ", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:03.957989", "sequence": 28, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "ลอตัวอย่างรุนแรงและต่อเนื่อง:** หากเศรษฐกิจโดยรวมถดถอยหรือชะลอตัวเป็นเวลานาน อุตสาหกรรมที่พึ่งพาการบริโภคหรือการลงทุนสูง เช่น อุตสาหกรรมยานยนต์ อสังหาริมทรัพย์ หรือสินค้าฟุ่มเฟือย", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:04.179335", "sequence": 29, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": " จะได้รับผลกระทบเป็นพิเศษ หากอุตสาหกรรมไม่สามารถฟื้นตัวได้แม้เศรษฐกิจจะกลับมาดีขึ้น อาจเป็นสัญญาณของการถดถอยเชิงโครงสร้างที่ยากจะกลับมาเติบโตได้อีกครั้งค่ะ\n*   **การเปลี่ยนแปลงโครงสร้างอุตสาหกรรม:** อุต", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:04.377142", "sequence": 30, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "สาหกรรมบางประเภทอาจถึงจุดอิ่มตัว (Maturity Stage) หรือถูกแทนที่ด้วยเทคโนโลยีใหม่ๆ รูปแบบธุรกิจที่แตกต่างออกไป หรือผลิตภัณฑ์ทดแทนที่มีประสิทธิภาพสูงกว่าอย่างสิ้นเชิง (Disruptive Innovation) ตัวอย่างที่เห็นได้ชัดคือ อุตสาหกรรมสื่อสิ่งพิมพ์ที่ถูกดิส", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:04.571310", "sequence": 31, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "รัปต์โดยสื่อดิจิทัลและโซเชียลมีเดีย หรืออุตสาหกรรมพลังงานที่กำลังเปลี่ยนผ่านจากพลังงานฟอสซิลสู่พลังงานหมุนเวียน การวิเคราะห์แนวโน้มนี้จะช่วยให้เห็นภาพรวมว่าอุตสาหกรรมกำลังเติบโต ช", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:04.777676", "sequence": 32, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "ะลอตัว หรือกำลังถูกแทนที่อย่างรวดเร็ว ซึ่งบริษัทในอุตสาหกรรมที่ไม่สามารถปรับตัวได้ทันก็จะประสบปัญหาอย่างหนักและอาจไม่สามารถอยู่รอดได้ค่ะ\n*   **แนวโน้มภาวะเศรษฐกิจมหภาค:** รวมถึงแนวโน้มการเปลี่ยนแปลงของอัตราดอกเบ", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:05.022923", "sequence": 33, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "ี้ย อัตราแลกเปลี่ยนเงินตราระหว่างประเทศ และอัตราเงินเฟ้อ ซึ่งมีผลโดยตรงต่อระดับราคารายได้ ต้นทุนขาย ค่าใช้จ่าย และกำไรจากการดำเนินงานของบริษัทในอุตสาหกรรมนั้นๆ หากปัจจัยเหล่านี้ผันผวนในทิศทางที่ไม่เอื้อ", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:05.210005", "sequence": 34, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "อำนวยอย่างต่อเนื่อง อาจส่งผลกระทบต่อความสามารถในการทำกำไรของอุตสาหกรรมโดยรวมค่ะ\n*   **ราคาวัตถุดิบและสินค้า/บริการที่สำคัญ:** การเปลี่ยนแปลงของราคาวัตถุดิบหลักที่สำคัญ หรือราคาสินค้าและบริการที่สำคัญของ", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:05.403564", "sequence": 35, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "อุตสาหกรรม หากมีการปรับตัวสูงขึ้นอย่างต่อเนื่องโดยไม่สามารถผลักภาระไปยังผู้บริโภคได้ หรือราคาขายลดลงอย่างรุนแรง อาจส่งผลกระทบต่ออัตรากำไรของอุตสาหกรรมได้ค่ะ\n\n**2. ปัจจัยด้านการแข่งขันและน", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:05.578681", "sequence": 36, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "วัตกรรม:**\n*   **การแข่งขันที่รุนแรงและคู่แข่งรายใหม่:** หากมีคู่แข่งรายใหม่เข้ามาในตลาดจำนวนมาก โดยเฉพาะคู่แข่งที่มีนวัตกรรมหรือโมเดลธุรกิจที่เหนือกว่า หรือคู่แข่งเดิมมีกลยุทธ์ที่ก้าวร้าวและมีประสิทธิภาพสูง เช่น", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:05.775888", "sequence": 37, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": " การตัดราคา การทำการตลาดเชิงรุก หรือการสร้างเครือข่ายที่แข็งแกร่ง อาจทำให้ส่วนแบ่งตลาดและอัตรากำไรของบริษัทในอุตสาหกรรมลดลงอย่างต่อเนื่องจนไม่สามารถทำกำไรได้ในที่สุด และอาจนำไปสู่การควบรวมกิจการหรือการ", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:05.955440", "sequence": 38, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "ออกจากตลาดของบริษัทที่อ่อนแอค่ะ\n*   **การขาดนวัตกรรมและการวิจัยและพัฒนา (R&D):** หากบริษัทส่วนใหญ่ในอุตสาหกรรมขาดการลงทุนในการวิจัยและพัฒนาสินค้าหรือบริการใหม่ๆ หรือไม่สามารถปรับปรุงคุณภาพให้ตอบสนองความต้องการที่เปลี่ยนไป", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:06.177823", "sequence": 39, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "ได้ ก็จะทำให้ความสามารถในการแข่งขันลดลงและถูกทิ้งห่างจากคู่แข่งที่มีนวัตกรรมใหม่ๆ ได้ง่าย ซึ่งเป็นสัญญาณว่าอุตสาหกรรมนั้นกำลังเข้าสู่ภาวะถดถอยค่ะ\n*   **การเปลี่ยนแปลงรูปแบบสินค้าและบริการ:** การที่อุตสาหกรรมไม่", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:06.393328", "sequence": 40, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "สามารถพัฒนาผลิตภัณฑ์ใหม่ ขยายธุรกิจ หรือยกเลิกผลิตภัณฑ์ที่ไม่ตอบโจทย์ตลาดได้ทันท่วงที เมื่อเทียบกับคู่แข่ง อาจส่งผลต่อความสามารถในการแข่งขันและส่วนแบ่งตลาดในระยะยาวค่ะ\n*   **โครงการวิจัยและพัฒนาในอนาคต:** หากบริษัทในอุตสาหกรรมไม่มี", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:06.580809", "sequence": 41, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "โครงการหรือการวิจัยและพัฒนาที่คาดว่าจะส่งผลกระทบต่อผลการดำเนินงานและฐานะทางการเงินในอนาคตอันใกล้ (ประมาณ 1 ปี) หรือโครงการเหล่านั้นไม่มีความคืบหน้าและผลกระทบที่ชัดเจน ก็อาจบ่งชี้ถึงการขาดการเตรียมพร้อมสำหรับการเปลี่ยนแปลงใน", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:06.776825", "sequence": 42, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "อนาคต ซึ่งโครงการที่จะเปิดเผยควรมีความแน่นอนในระดับหนึ่งก่อน ไม่ใช่เป็นโครงการที่กล่าวอ้างลอย ๆ ค่ะ\n\n**3. ปัจจัยด้านพฤติกรรมผู้บริโภคและสังคม:**\n*   **การเปลี่ยนแปลงพฤติกรรมผู้บริโภคอย่างรวดเร็ว", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:07.004858", "sequence": 43, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": ":** หากผู้บริโภคมีความต้องการหรือพฤติกรรมที่เปลี่ยนไปอย่างรวดเร็วและถาวร และอุตสาหกรรมไม่สามารถปรับตัวตามได้ทัน เช่น ความต้องการสินค้าที่เป็นมิตรต่อสิ่งแวดล้อมและมีความยั่งยืนมากขึ้น หรือบริการที่เน้นความสะดวกสบายผ่าน", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:07.287242", "sequence": 44, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "แพลตฟอร์มดิจิทัลและ Personalization อุตสาหกรรมที่ไม่ตอบสนองต่อการเปลี่ยนแปลงเหล่านี้อาจสูญเสียฐานลูกค้าและความนิยมไปอย่างรวดเร็ว เช่น อุตสาหกรรมค้าปลีกแบบดั้งเดิมที่ถูกดิสรัปต์โดย E-commerce และแพลต", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:07.489608", "sequence": 45, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "ฟอร์มออนไลน์ค่ะ\n*   **แนวโน้มด้านสิ่งแวดล้อม สังคม และธรรมาภิบาล (ESG):** การที่อุตสาหกรรมไม่สามารถปรับตัวให้เข้ากับแนวโน้มด้านความยั่งยืน การเคารพสิทธิมนุษย", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:07.680040", "sequence": 46, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "ชน หรือการมีธรรมาภิบาลที่ดี อาจส่งผลกระทบต่อภาพลักษณ์ ความน่าเชื่อถือ และความสามารถในการดึงดูดนักลงทุนและผู้บริโภคในระยะยาวได้ค่ะ\n\n**4. ปัจจัยด้านกฎหมายและกฎระเบียบ:**\n*   **การเปลี่ยนแปลง", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:07.891912", "sequence": 47, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "กฎหมายหรือนโยบายของหน่วยงานรัฐ:** การเปลี่ยนแปลงกฎหมายหรือนโยบายที่สำคัญ เช่น การเปิดเสรีทางการค้า การจำกัดการนำเข้าหรือส่งออก การกำหนดโควต้า การเปลี่ยนแปลงโครงสร้างอัตราภาษี และการควบคุมผลกระทบต่อสิ่งแวดล้อม อาจส่งผลกระทบอย่างมี", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:08.102634", "sequence": 48, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "นัยสำคัญต่อต้นทุนการดำเนินงาน กลยุทธ์การแข่งขัน และความสามารถในการทำกำไรของอุตสาหกรรมค่ะ\n*   **การไม่ปฏิบัติตามกฎระเบียบ:** หากบริษัทในอุตสาหกรรมมีการไม่ปฏิบัติตามกฎระเบียบที่เกี่ยวข้อง", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:08.322471", "sequence": 49, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "กับการดำเนินธุรกิจอย่างแพร่หลาย อาจนำไปสู่การถูกสั่งพักการประกอบธุรกิจเป็นการชั่วคราว หรืออาจถูกเพิกถอนการประกอบธุรกิจ ซึ่งส่งผลกระทบต่อความน่าเชื่อถือและความยั่งยืนของอุตสาหกรรมโดยรวมค่ะ\n\n**5. ปัจจัยด้านความเส", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:08.524515", "sequence": 50, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "ี่ยงเฉพาะ:**\n*   **การสูญเสียลูกค้ารายใหญ่หรือผู้จัดหาวัตถุดิบ (Suppliers) ที่สำคัญ:** หากอุตสาหกรรมพึ่งพิงลูกค้ารายใหญ่หรือผู้จัดหาวัตถุดิบเพียงไม่กี่ราย การสูญเสียรายใดราย", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:08.724605", "sequence": 51, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "หนึ่งไปอาจส่งผลกระทบอย่างรุนแรงต่อการดำเนินงานและรายได้ของอุตสาหกรรมได้ค่ะ\n*   **คดีความสำคัญหรือการถูกคว่ำบาตร (Sanction):** การมีคดีความสำคัญกับลูกค้าหรือผู้จัดหาวัตถุดิบ หรือการถูกคว", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:08.995520", "sequence": 52, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "่ำบาตรจากประเทศที่ตั้งของคู่ค้าหรือบริษัทคู่ค้า อาจสร้างความเสียหายอย่างใหญ่หลวงต่อชื่อเสียงและความสามารถในการดำเนินธุรกิจของอุตสาหกรรมได้ค่ะ\n*   **การรวมธุรกิจ การยกเลิก หรือการเปลี่ยนแปลงลักษณะธุรกิจ:** การที่บริษัทในอุตสาหกรรมมีการรวมกิจ", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:09.217630", "sequence": 53, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "การ การยกเลิกหรือหยุดการดำเนินธุรกิจบางส่วน การขยายส่วนงาน การได้มาหรือจำหน่ายไปซึ่งสินทรัพย์ที่มีความสำคัญ หรือการเปลี่ยนแปลงลักษณะการประกอบธุรกิจอย่างมีนัยสำคัญ อาจเป็นสัญญาณของการปรับตัวเพื่อความอยู่รอด หรือในทางกลับกัน อาจเป็นสัญญาณของความอ่อน", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:09.428512", "sequence": 54, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "intermediate_chunk", "content": "แอในอุตสาหกรรมได้ค่ะ\n\nการพิจารณาปัจจัยเหล่านี้ร่วมกันจะช่วยให้เราสามารถประเมินภาพรวมของอุตสาหกรรมและคาดการณ์แนวโน้มในอนาคตได้ค่ะ หากมีข้อสงสัยเพิ่มเติม สามารถสอบถามได้เลยนะคะ", "run_id": "c070a118-58e9-4f04-abb3-db2249186420", "parent_ids": [], "timestamp": "2025-11-18T05:28:09.621992", "sequence": 55, "metadata": {"source": "llm_stream", "timing": null, "tool": null, "agent": null}, "is_chunk": true, "is_final": false}

data: {"event": "ttfb_final_answer", "content": "", "metadata": {"time_to_first_token_ms": 34179, "phase": "rag_final_answer"}, "is_chunk": true}

data: {"event": "update_event", "content": "Answer Status: Completed", "is_chunk": true, "is_final": false}

data: {"event": "update_event", "content": "Confidence Score: 0.76", "metadata": {"source": "llm_stream", "score": {"sim_query_context": 0.7124463232479585, "avg_sim_answer_context": 0.7518561449873824, "sim_query_answer": 0.8362992131714007}}, "is_chunk": true}

data: {"event": "update_event", "content": "Answer Status: Completed", "is_chunk": true, "is_final": false}

data: {"event": "update_event", "content": "Confidence Score: 0.76", "metadata": {"source": "llm_stream", "score": {"sim_query_context": 0.7124463232479585, "avg_sim_answer_context": 0.7518561449873824, "sim_query_answer": 0.8362992131714007}}, "is_chunk": true}

data: {"event": "update_event", "content": "Confidence Score: 0.76", "metadata": {"source": "llm_stream", "score": {"sim_query_context": 0.7124463232479585, "avg_sim_answer_context": 0.7518561449873824, "sim_query_answer": 0.8362992131714007}}, "is_chunk": true}

: ping - 2025-11-18 05:28:16.598222

data: {"status": "completed", "stream_id": "e1e73ec3-6190-4bea-8d92-cef9eeb9facf"}`

export default function Home() {
  const [streamData, setStreamData] = useState<ReturnType<typeof formatRAGStreamData> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentData, setCurrentData] = useState<string>("")

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      const text = await file.text()
      const count = (text.match(/"is_duplicate"/g) || []).length
      console.log("[v0] File uploaded, length:", text.length)
      console.log(`[v0] File contains "is_duplicate": ${count} times`)
      setCurrentData(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const count = (newValue.match(/"is_duplicate"/g) || []).length
    console.log("[v0] Input changed, new length:", newValue.length)
    console.log(`[v0] Contains "is_duplicate": ${count} times`)
    console.log("[v0] First 100 chars:", newValue.substring(0, 100))
    setCurrentData(newValue)
    setError(null)
  }

  const handleSubmit = () => {
    try {
      setError(null)

      const count = (currentData.match(/"is_duplicate"/g) || []).length
      console.log("[v0] === SUBMIT ANALYSIS ===")
      console.log("[v0] currentData length:", currentData.length)
      console.log(`[v0] currentData contains "is_duplicate": ${count} times`)
      console.log("[v0] First 200 chars of data to analyze:", currentData.substring(0, 200))
      console.log("[v0] Last 200 chars of data to analyze:", currentData.substring(currentData.length - 200))

      const formatted = formatRAGStreamData(currentData)
      setStreamData(formatted)
    } catch (err) {
      console.error("[v0] Submit error:", err)
      setError(err instanceof Error ? err.message : "Failed to parse JSON")
    }
  }

  const handleFormat = () => {
    try {
      setError(null)
      const objs = parseRawToObjects(currentData)
      const pretty = objs.length === 1 ? JSON.stringify(objs[0], null, 2) : JSON.stringify(objs, null, 2)
      setCurrentData(pretty)
    } catch (err) {
      console.error("[v0] Format error:", err)
      setError(err instanceof Error ? err.message : "Failed to format input")
    }
  }

  const handleBack = () => {
    setStreamData(null)
  }

  const handleReset = () => {
    setStreamData(null)
    setCurrentData("")
    setError(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <FileJson className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">RAG Stream Viewer</h1>
                <p className="text-sm text-muted-foreground">Visualize and analyze streaming data</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!streamData ? (
          <Card className="p-8 bg-card/30 backdrop-blur-sm border-border/50">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">RAG Stream Data Editor</h2>
                  <p className="text-muted-foreground">Paste, upload, or edit your JSON data</p>
                </div>
                <label>
                  <Button variant="outline" asChild className="cursor-pointer bg-transparent">
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground">
                    Paste or edit your JSON data below
                  </label>
                  {!currentData && (
                    <Button variant="ghost" size="sm" onClick={() => setCurrentData(DEFAULT_EXAMPLE)}>
                      Load Example
                    </Button>
                  )}
                </div>
                <textarea
                  value={currentData}
                  onChange={handleInputChange}
                  placeholder={`Paste your RAG stream here. Accepts SSE-style lines starting with 'data: {...}' (ping lines like ': ping - ...' will be ignored), or a full JSON object with {"chunk_list": [...] }.`}
                  className="w-full h-[500px] p-4 rounded-lg bg-background border border-border font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  Current length: {currentData.length} characters
                  {currentData.length > 0 && (
                    <span> | "is_duplicate" count: {(currentData.match(/"is_duplicate"/g) || []).length}</span>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                {currentData && (
                  <Button onClick={handleReset} variant="outline" size="lg">
                    Clear All
                  </Button>
                )}
                <Button onClick={handleFormat} variant="outline" size="lg" disabled={!currentData}>
                  Format JSON
                </Button>
                <Button onClick={handleSubmit} className="flex-1" size="lg" disabled={!currentData}>
                  Submit & Analyze
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Stream Analysis</h2>
                <p className="text-muted-foreground">Displaying {streamData?.length} events</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Edit
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <Upload className="w-4 h-4 mr-2" />
                  Load New Data
                </Button>
              </div>
            </div>

            <StreamViewer items={streamData || []} />
          </div>
        )}
      </main>
    </div>
  )
}
