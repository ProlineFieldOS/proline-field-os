import { dollarWords, LIEN_NOTICES, STATES, today } from './utils'

export function generateContractText(d, settings = {}) {
  const co = settings
  const state = d.projectState || 'SC'
  const sName = STATES[state] || 'South Carolina'
  const pmethods = d.paymentMethods || 'Check, Zelle, ACH'
  const coCustomer = d.coCustomerName ? `\nCO-CUSTOMER / SPOUSE: ${d.coCustomerName}` : ''

  let paySchedule = ''
  let latePay = ''
  const fee = d.lateFee || 1.5
  const annualized = fee * 12

  if (d.paymentVersion === 'A') {
    paySchedule = `(a) Materials Deposit: ${formatM(d.deposit)}, due prior to commencement of Work and prior to procurement of materials. Work shall not begin and materials shall not be ordered until Contractor receives this deposit in cleared funds. This deposit is non-refundable once materials have been ordered or custom-fabricated.\n\n(b) Balance at Completion: The remaining balance of ${formatM(d.price - d.deposit)} is due within three (3) business days of Contractor's notice of substantial completion.`
    latePay = `3.2 LATE PAYMENT.\n\n(a) INTEREST ON LATE PAYMENTS. Any amount not received within five (5) calendar days of the due date shall accrue interest at ${fee}% per month (${annualized}% per annum) from the original due date until paid in full.\n\n(b) DISPUTED AMOUNTS. If Customer disputes any portion of the final balance, Customer shall provide written notice of the specific basis for the dispute within three (3) business days of receipt of Contractor's completion notice. The parties shall resolve disputes in good faith within ten (10) business days. Undisputed portions remain due on the original due date.`
  } else if (d.paymentVersion === 'B') {
    paySchedule = `(a) Materials Deposit: ${formatM(d.deposit)}, due prior to commencement of Work and prior to procurement of materials. Non-refundable once materials have been ordered or custom-fabricated.\n\n(b) Weekly Labor Draws: Labor draws shall be invoiced each Friday for work completed through that week, due within two (2) business days of invoice.\n\n(c) All Remaining Balance Due at Completion: Any remaining unpaid balance shall become due and payable in full within three (3) business days of Contractor's notice of substantial completion.`
    latePay = buildFullLatePay(fee, annualized)
  } else {
    const milestones = (d.milestones || []).map((m, i) => `— Milestone ${i+1}: ${m.description} — ${formatM(m.amount)} due within two (2) business days of completion`).join('\n')
    paySchedule = `(a) Materials Deposit: ${formatM(d.deposit)}, due prior to commencement of Work. Non-refundable once materials have been ordered.\n\n(b) Milestone Draw Schedule (see Exhibit A):\n${milestones}\n\n(c) All Remaining Balance Due at Completion: Any remaining unpaid balance due within three (3) business days of Contractor's notice of substantial completion.`
    latePay = buildFullLatePay(fee, annualized)
  }

  const permitArticle = buildPermitArticle(d)
  const hoaArticle = d.includeHOA ? `\n\nARTICLE 6A — HOA COMPLIANCE\n\nCustomer represents that Customer has obtained or will obtain all required HOA approvals for the Work prior to commencement. Customer shall provide Contractor with copies of any HOA approval documents upon request. Contractor is not responsible for obtaining HOA approval, and delays caused by HOA review or approval processes are excusable delays under Article 7. Any modifications required by the HOA after contract execution shall be addressed by written Change Order.` : ''

  const maintItems = (d.maintenanceItems || '').trim() || 'Customer shall maintain the Work in accordance with industry-standard maintenance practices appropriate for the materials installed.'
  const warrantyYears = d.warrantyYears || 5
  const warrantyWord = { 5: 'FIVE', 7: 'SEVEN', 10: 'TEN' }[warrantyYears] || String(warrantyYears).toUpperCase()
  const insOcc = d.insurancePerOccurrence || '1,000,000'
  const insAgg = d.insuranceAggregate || '2,000,000'
  const primaryState = STATES[co.primaryState || 'SC'] || 'South Carolina'

  let doc = `PROLINE RESIDENTIAL LLC\nServing SC · NC · GA · TN · VA\n\nRESIDENTIAL CONSTRUCTION CONTRACT\n\nContract No.: ${d.contractNum}\nDate: ${today()}\n\n`

  doc += hr('ARTICLE 1 — PARTIES TO THIS AGREEMENT')
  doc += `This Residential Construction Contract (the "Agreement") is entered into as of the date last signed below by and between:\n\n`
  doc += `CONTRACTOR: Proline Residential LLC, a ${sName} Limited Liability Company\n`
  doc += `${co.coCity ? co.coCity + ', ' : ''}${sName}\n`
  doc += co.coPhone ? `Phone: ${co.coPhone}\n` : ''
  doc += co.coEmail ? `Email: ${co.coEmail}\n` : ''
  doc += co.license ? `License #: ${co.license}\n` : ''
  doc += `"Contractor"\n\n`
  doc += `CUSTOMER: ${d.customerName}\n${d.customerAddress}\n`
  doc += d.customerPhone ? `Phone: ${d.customerPhone}\n` : ''
  doc += d.customerEmail ? `Email: ${d.customerEmail}\n` : ''
  doc += `${coCustomer}\n"Customer"\n\nProject Site: ${d.projectAddress}\n\n`
  doc += `1.1 ENTITY LIMITATION OF LIABILITY. This Agreement is entered into solely between Proline Residential LLC (the "Contractor") and Customer. No individual employee, member, manager, officer, subcontractor, supplier, or agent of Contractor shall be personally liable for any default, breach, obligation, or liability arising under or related to this Agreement. All rights and obligations are solely those of the contracting entity.\n\n`

  doc += hr('ARTICLE 2 — SCOPE OF WORK')
  doc += `Contractor agrees to furnish all labor, materials, equipment, and services necessary to complete the following Work at the Project Site in a good and workmanlike manner, in accordance with all applicable building codes and regulations (the "Work"):\n\n`
  doc += `${d.scope}\n\n`
  doc += `Work Type: ${d.workType || ''}\n`
  doc += `Estimated Start Date: ${d.startDate ? new Date(d.startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'To be mutually agreed upon'}\n`
  doc += `Estimated Completion: ${d.estimatedCompletion || `Approximately ${d.durationDays || '[X]'} days from start`}\n\n`
  doc += `⚠ ESTIMATED DATES ARE NOT GUARANTEED. The start and completion dates above are good-faith estimates only. Delays caused by Customer actions or inactions, material vendor lead times or shortages, subcontractor scheduling conflicts, inclement or unsafe weather conditions, permit or inspection delays, concealed field conditions, or any other circumstances outside of Contractor's reasonable control may result in a delay. Contractor will communicate scheduling changes as they arise and bears no liability for delays caused by factors outside of Contractor's reasonable control.\n\n`
  doc += `This Agreement covers only the Work described above. Any additional work, modifications, or items not expressly stated herein require a signed written Change Order executed by both parties prior to commencement of such additional work.\n\n`

  doc += hr('ARTICLE 3 — CONTRACT PRICE AND PAYMENT TERMS')
  doc += `Total Contract Price: ${formatM(d.price)} (${dollarWords(d.price)})\n\n`
  doc += `3.1 PAYMENT SCHEDULE.\n\n${paySchedule}\n\n`
  doc += `${latePay}\n\n`
  doc += `3.3 PAYMENT METHODS. Contractor accepts the following payment methods: ${pmethods}. All checks payable to Proline Residential LLC. Contractor is not responsible for payments made to any individual rather than the company entity.\n\n`
  doc += `3.4 CHANGE ORDER PAYMENTS. All Change Orders require a materials deposit as specified in the applicable Change Order before any materials will be procured or any work on the Change Order will begin, regardless of the Customer's payment history on the original Contract. For Required Change Orders, the materials deposit must be received before work on the affected portion of the original scope resumes. No exceptions.\n\n`

  doc += hr('ARTICLE 4 — CHANGES IN WORK; CHANGE ORDERS')
  doc += `4.1 WRITTEN CHANGE ORDERS REQUIRED. No change to the scope, price, or schedule of the Work shall be effective or binding unless documented in a written Change Order signed by both parties before the changed Work is performed. Verbal authorizations are not binding on Contractor.\n\n4.2 ADMINISTRATIVE FEE. Each Customer-Requested Change Order processed by Contractor is subject to an administrative processing fee as set forth in Contractor's current fee schedule. This fee is due at the time the Change Order is signed and is non-refundable.\n\n4.3 MATERIALS DEPOSITS ON CHANGE ORDERS. All Change Orders requiring material procurement require a materials deposit before Contractor will procure materials or begin work on the Change Order. No work will proceed on any Change Order without a materials deposit in cleared funds.\n\n4.4 CUSTOMER-REQUESTED CHANGES. Customer may request changes to scope at any time. Contractor shall prepare a written Change Order including an administrative fee and required materials deposit. Customer must sign and return the Change Order and pay the materials deposit before changed work begins.\n\n4.5 REQUIRED CHANGES. If Contractor discovers conditions affecting life safety, structural integrity, code compliance, or warrantability of the Work, Contractor shall stop or modify affected Work and issue a Required Change Order. Customer must provide written approval or written declination before work proceeds.\n\n4.6 CUSTOMER DECLINATION. If Customer declines a Required Change Order, Customer shall execute a written Declination Acknowledgment. For life/safety/structural/code conditions, work will not proceed without correction. For warranty-only conditions, work may proceed but no warranty will be issued on affected Work. All prior payments are non-refundable in either case.\n\n4.7 RESPONSE DEADLINE. Customer must respond to all Change Orders in writing within the timeframe specified on the Change Order. Failure to respond constitutes a deemed declination.\n\n4.8 CONCEALED CONDITIONS. The Contract Price is based on conditions visible and reasonably ascertainable at the time of estimate. Concealed or unknown conditions materially differing from those represented shall be addressed by written Change Order before work proceeds.\n\n`

  doc += hr('ARTICLE 5 — WARRANTY')
  doc += `⚠ IMPORTANT: This warranty contains maintenance requirements that are CONDITIONS of coverage. Failure to perform required maintenance voids this warranty.\n\n`
  doc += `5.1 WORKMANSHIP AND MATERIALS WARRANTY. Contractor warrants all labor and materials furnished under this Agreement to be free from defects for a period of:\n\n${warrantyYears} (${warrantyWord}) YEARS from the date of final completion\n\nsubject to all conditions, exclusions, and maintenance requirements set forth in this Article.\n\n`
  doc += `5.2 MAINTENANCE REQUIREMENT — CONDITION PRECEDENT. This warranty is expressly conditioned upon Customer performing all maintenance items listed below:\n\n${maintItems}\n\n`
  doc += `⚠ WARRANTY VOID: Failure to perform required maintenance, or failure to retain documentation of maintenance performed, renders this warranty null and void without further obligation of Contractor.\n\n`
  doc += `5.3 WARRANTY EXCLUSIONS. This warranty does not cover: (a) Acts of God including hail, wind, flood, or lightning; (b) damage from Customer's or any third party's alterations, negligence, or misuse; (c) damage from improper site drainage; (d) conditions disclosed via Required Change Order that Customer declined to correct; (e) Customer-supplied materials; (f) normal wear, fading, or weathering; (g) pre-existing conditions; (h) pest or biological damage; (i) consequential or incidental damages.\n\n`
  doc += `5.4 WARRANTY REMEDY. Upon timely written notice, Contractor shall inspect and, if covered, repair or replace the defective Work at Contractor's sole election. This is Customer's exclusive warranty remedy.\n\n`
  doc += `5.5 NON-TRANSFERABILITY. This warranty is personal to the original Customer and applies only to the Project Site. It is not transferable to any subsequent owner or occupant.\n\n`

  doc += permitArticle + hoaArticle + '\n\n'

  doc += hr('ARTICLE 7 — SCHEDULE AND DELAYS')
  doc += `7.1 Contractor shall perform the Work with reasonable diligence within the estimated timeframe set forth in Article 2, subject to excusable delays as defined herein.\n\n7.2 EXCUSABLE DELAYS. Contractor shall not be liable for delays caused by: (i) Customer-requested changes; (ii) Acts of God, severe weather, or inclement weather conditions; (iii) supply chain disruptions or material shortages; (iv) permit or inspection delays; (v) Customer's failure to make timely payment; (vi) concealed conditions requiring additional work; (vii) HOA review or approval processes; or (viii) any other cause beyond Contractor's reasonable control.\n\n7.3 WEATHER SPECIFICALLY. Many work types performed by Contractor cannot be performed safely in rain, high humidity, extreme heat, or high wind conditions. Customer acknowledges that weather-related delays are inherent in exterior construction and that Contractor's judgment regarding weather suitability is final.\n\n7.4 TIME IS NOT OF THE ESSENCE. Unless expressly stated in a signed written addendum, time is not of the essence under this Agreement.\n\n`

  doc += hr('ARTICLE 8 — INSURANCE')
  doc += `8.1 Contractor represents and warrants that it maintains: (a) Commercial General Liability insurance — not less than $${insOcc} per occurrence and $${insAgg} in the aggregate; (b) Workers' Compensation coverage as required by applicable state law; (c) Automobile liability coverage for owned, hired, and non-owned vehicles.\n\n8.2 Contractor shall provide certificates of insurance to Customer upon written request. Customer shall not be named as an additional insured on any Contractor insurance policy.\n\n`

  doc += hr("ARTICLE 9 — MECHANIC'S LIEN RIGHTS")
  doc += `⚠ NOTICE TO CUSTOMER: Contractor has the right to file a mechanic's lien against your property for unpaid labor and materials. This is a statutory right under applicable state law. Read this Article carefully.\n\n`
  doc += LIEN_NOTICES[state] + '\n\n'

  doc += hr('ARTICLE 10 — DISPUTE RESOLUTION AND GOVERNING LAW')
  doc += `10.1 GOOD FAITH NEGOTIATION. Prior to initiating any formal proceedings, the parties shall attempt resolution through good-faith negotiation within ten (10) business days of written notice of dispute.\n\n10.2 BINDING ARBITRATION. Any dispute not resolved within thirty (30) days of written notice shall be submitted to final and binding arbitration under the Construction Industry Arbitration Rules of the AAA. Arbitration shall be conducted in ${primaryState} (Contractor's primary operational state) unless the parties mutually agree otherwise in writing. The substantive laws of the State of ${sName} shall govern interpretation of this Agreement.\n\n10.3 RECOVERY OF ALL COSTS BY PREVAILING PARTY. The prevailing party in any arbitration or legal proceeding arising from or related to this Agreement shall be entitled to recover from the non-prevailing party ALL costs and expenses incurred, including without limitation: reasonable attorney's fees; arbitration filing fees and administrative costs; arbitrator compensation; expert witness fees; court costs and filing fees; deposition and transcript costs; travel expenses; lost wages and lost business income; and any other fees, costs, or expenses of any kind incurred in connection with the dispute.\n\n10.4 WAIVER OF JURY TRIAL. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE PARTIES KNOWINGLY, VOLUNTARILY, AND INTENTIONALLY WAIVE ANY RIGHT TO A TRIAL BY JURY IN ANY ACTION ARISING FROM OR RELATING TO THIS AGREEMENT.\n\n`

  doc += hr('ARTICLE 11 — LIMITATION OF LIABILITY')
  doc += `11.1 IN NO EVENT SHALL CONTRACTOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO THIS AGREEMENT.\n\n11.2 CONTRACTOR'S TOTAL CUMULATIVE LIABILITY SHALL NOT EXCEED THE TOTAL CONTRACT PRICE ACTUALLY PAID BY CUSTOMER TO CONTRACTOR UNDER THIS AGREEMENT.\n\n`

  doc += hr('ARTICLE 12 — FALSE OR MISLEADING STATEMENTS; WRONGFUL CLAIMS')
  doc += `12.1 Customer represents that all statements and information provided to Contractor are true, complete, and not misleading. Customer shall not make any false or misleading statements in connection with or arising from this Agreement.\n\n12.2 If Customer makes any false or materially misleading statement — including in connection with any attempt to initiate or support any civil claim, regulatory complaint, criminal complaint, or any other proceeding against Contractor — Customer shall be liable to Contractor for all resulting damages, including without limitation: (a) all direct damages; (b) all attorney's fees, arbitration costs, investigation costs, and expert fees; (c) lost wages, lost business income, and lost opportunity costs; (d) reputational damages to the extent ascertainable; and (e) punitive damages to the fullest extent permitted by the law of the applicable jurisdiction.\n\n`

  doc += hr('ARTICLE 13 — GENERAL PROVISIONS')
  doc += `13.1 ENTIRE AGREEMENT. This Agreement, together with all signed Change Orders and incorporated exhibits, constitutes the entire agreement between the parties and supersedes all prior oral or written negotiations.\n\n13.2 AMENDMENTS. This Agreement may be amended only by written instrument signed by both parties. No oral modification is effective.\n\n13.3 SEVERABILITY. If any provision is held invalid, it shall be modified to the minimum extent necessary to make it enforceable, and the remainder remains in full force.\n\n13.4 WAIVER. No waiver of any breach shall be construed as a waiver of any subsequent breach or default.\n\n13.5 NOTICES. All notices shall be in writing and delivered by email with delivery confirmation, hand delivery, or certified mail.\n\n13.6 INDEPENDENT CONTRACTOR. Contractor is an independent contractor and not an employee, agent, joint venturer, or partner of Customer.\n\n13.7 GOVERNING LAW. This Agreement is governed by the laws of the State of ${sName}, without regard to conflicts of law principles.\n\n13.8 ELECTRONIC SIGNATURES. Electronic signatures are deemed valid and binding to the same extent as original signatures under the federal E-SIGN Act and applicable state UETA adoptions.\n\n13.9 ENTITY LIMITATION. This Agreement is exclusively between Proline Residential LLC and Customer. No officer, member, manager, employee, subcontractor, or agent of Contractor shall be personally liable for any obligation, default, or liability arising under this Agreement.\n\n`

  doc += hr('ARTICLE 14 — EXECUTION AND ACKNOWLEDGMENT')
  doc += `BY SIGNING BELOW, EACH PARTY CONFIRMS: THEY HAVE READ THIS ENTIRE AGREEMENT; THEY UNDERSTAND ITS TERMS; THEY HAVE HAD THE OPPORTUNITY TO CONSULT INDEPENDENT LEGAL COUNSEL; AND THEY AGREE TO BE BOUND BY ALL PROVISIONS INCLUDING THE ARBITRATION CLAUSE, JURY TRIAL WAIVER, AND LIMITATION OF LIABILITY.\n\n`
  doc += `IN WITNESS WHEREOF, the parties have executed this Agreement as of the date last signed below.\n\n`
  doc += `CONTRACTOR — Proline Residential LLC\nAuthorized Signatory _______________________________ Date ______________\nPrint Name & Title: ____________________________________________________\n\n`
  doc += `CUSTOMER — ${d.customerName}\nSignature _______________________________ Date ______________\nPrint Name: ____________________________________________________\n`
  if (d.coCustomerName) {
    doc += `\nCO-CUSTOMER — ${d.coCustomerName}\nSignature _______________________________ Date ______________\nPrint Name: ____________________________________________________\n`
  }

  return doc
}

// ── CO Text Generators ────────────────────────────────────────────

export function generateCO02Text(d) {
  let doc = `PROLINE RESIDENTIAL LLC\nServing SC · NC · GA · TN · VA\n\nCHANGE ORDER — CUSTOMER REQUESTED\n\nDocument No.: ${d.coNum}\nDate: ${today()}\n\n`
  doc += `⚠ NOTICE: No work shall begin on this Change Order until it is fully executed by both parties AND the materials deposit has been received by Contractor in cleared funds.\n\n`
  doc += `⚠ RESPONSE DEADLINE: Customer must sign and return this Change Order within ${d.responseDays || 5} calendar days. If no signed response is received, the Change Order will be considered declined. Verbal communications will not be accepted as a response.\n\n`
  doc += hr('SECTION 1 — REFERENCE INFORMATION')
  doc += `Original Contract No.: ${d.originalContractNum || '[CONTRACT-XXXX]'}\nChange Order No.: ${d.coNum}\nProject Address: ${d.projectAddress || ''}\nContractor: Proline Residential LLC\nCustomer: ${d.customerName || ''}\nDate Issued: ${today()}\n\n`
  doc += hr('SECTION 2 — DESCRIPTION OF REQUESTED CHANGE')
  doc += `At the specific request of Customer, the scope of Work under the original Contract is hereby modified as follows:\n\n${d.description}\n\nCustomer acknowledges this change was initiated at Customer's direction and was not required by field conditions, code requirements, or Contractor's professional obligations.\n\n`
  doc += hr('SECTION 3 — ADMINISTRATIVE FEE')
  doc += `Change Order Administrative Fee: ${formatM(d.adminFee || 75)} — NON-REFUNDABLE\n\nThe administrative fee covers Contractor's costs to process, document, price, and schedule this Change Order. This fee is earned upon execution and is non-refundable regardless of whether the Change Order work is ultimately performed.\n\n`
  doc += hr('SECTION 4 — CONTRACT PRICE ADJUSTMENT AND MATERIALS DEPOSIT')
  doc += `Original Contract Price:                        ${formatM(d.originalContractPrice || 0)}\nTotal Paid by Customer to Date:                 ${formatM(d.totalPaidToDate || 0)} — NON-REFUNDABLE\nAdministrative Fee:                             ${formatM(d.adminFee || 75)} — NON-REFUNDABLE\nThis Change Order Amount (ADD / DEDUCT):        ${formatM(d.coAmount || 0)}\nMaterials Deposit Required Before Work Begins:  ${formatM(d.materialsDeposit || 0)} (non-refundable once ordered)\nREVISED CONTRACT PRICE:                         ${formatM((d.originalContractPrice || 0) + (d.coAmount || 0))}\n\n`
  doc += `Work will not begin until: (1) this document is signed by both parties; AND (2) the materials deposit is received by Contractor in cleared funds. All payments made on the original Contract to date are non-refundable.\n\n`
  doc += hr('SECTION 5 — SCHEDULE ADJUSTMENT')
  doc += d.scheduleImpact ? `This Change Order extends the schedule by ${d.scheduleDays} days.\nNew estimated completion: ${d.newCompletion || 'To be determined'}\n\n` : `This Change Order does NOT affect the schedule.\n\n`
  doc += hr('SECTION 6 — EFFECT ON ORIGINAL CONTRACT')
  doc += `Except as expressly modified herein, all terms and conditions of the original Contract — including warranty, maintenance requirements, lien rights, dispute resolution, insurance, and limitation of liability — remain in full force and effect.\n\n`
  doc += hr('SECTION 7 — AUTHORIZATION AND SIGNATURES')
  doc += `NO WORK SHALL COMMENCE ON THIS CHANGE ORDER UNTIL: (1) SIGNED BY BOTH PARTIES; AND (2) MATERIALS DEPOSIT RECEIVED IN CLEARED FUNDS. VERBAL AUTHORIZATIONS ARE NOT BINDING.\n\n`
  doc += `CONTRACTOR — Proline Residential LLC\nAuthorized Signatory _______________________________ Date ______________\nPrint Name & Title: ____________________________________________________\n\n`
  doc += `CUSTOMER — ${d.customerName || '[CUSTOMER FULL LEGAL NAME]'}\nSignature _______________________________ Date ______________\nPrint Name: ____________________________________________________\n`
  if (d.coCustomerName) doc += `\nCO-CUSTOMER — ${d.coCustomerName}\nSignature _______________________________ Date ______________\n`
  return doc
}

export function generateCO03AText(d) {
  let doc = `PROLINE RESIDENTIAL LLC\nServing SC · NC · GA · TN · VA\n\nREQUIRED CHANGE ORDER\nLIFE SAFETY · STRUCTURAL INTEGRITY · CODE COMPLIANCE\n\nDocument No.: ${d.coNum}\nDate: ${today()}\n\n`
  doc += `⚠ NOTICE TO CUSTOMER: Contractor has identified a condition affecting life safety, structural integrity, or code compliance. WORK CANNOT PROCEED in any form without Customer's written approval. All payments made to date are non-refundable regardless of Customer's election.\n\n`
  doc += `⚠ RESPONSE DEADLINE: Customer must sign and return this Change Order within ${d.responseDays || 5} calendar days. Verbal communications will not be accepted.\n\n`
  doc += hr('SECTION 1 — REFERENCE INFORMATION')
  doc += `Original Contract No.: ${d.originalContractNum || '[CONTRACT-XXXX]'}\nChange Order No.: ${d.coNum}\nProject Address: ${d.projectAddress || ''}\nCustomer: ${d.customerName || ''}\nDate Issued: ${today()}\n\n`
  doc += hr('SECTION 2 — NATURE OF THIS CHANGE ORDER')
  const checks = []
  if (d.lifeSafety) checks.push('[X]  Risk to life or safety of occupants, workers, or third parties')
  if (d.structural) checks.push('[X]  Compromise of structural integrity of the property or the installed Work')
  if (d.codeViolation) checks.push('[X]  Violation of applicable building codes as discovered in the field')
  doc += `During performance of the Work, Contractor identified the following condition that prevents the Work from continuing without correction:\n\n${checks.join('\n')}\n\nBecause this condition falls into one or more of the categories above, Contractor CANNOT and WILL NOT install new Work over, adjacent to, or dependent upon the identified condition without correction. Customer's only options are to approve this Change Order or to terminate this Contract.\n\n`
  doc += hr('SECTION 3 — DESCRIPTION OF DISCOVERED CONDITION')
  doc += `${d.conditionDescription}\n\n`
  doc += hr('SECTION 4 — REQUIRED CORRECTIVE WORK')
  doc += `${d.correctiveWork}\n\n`
  doc += hr('SECTION 5 — CONSEQUENCES OF NON-APPROVAL')
  doc += `⚠ READ CAREFULLY: The following describes what will occur if Customer declines this Required Change Order.\n\n${d.consequences}\n\n`
  doc += hr('SECTION 6 — PAYMENT STATUS AND CONTRACT PRICE')
  doc += `⚠ ALL PAYMENTS MADE BY CUSTOMER PRIOR TO THE DATE OF THIS CHANGE ORDER ARE NON-REFUNDABLE, REGARDLESS OF CUSTOMER'S ELECTION.\n\nOriginal Contract Price:                    ${formatM(d.originalContractPrice || 0)}\nTotal Paid by Customer to Date:             ${formatM(d.totalPaidToDate || 0)} — NON-REFUNDABLE\nThis Change Order Amount:                   ${formatM(d.coAmount || 0)}\nMaterials Deposit (Required Before Work):   ${formatM(d.materialsDeposit || 0)}\nREVISED CONTRACT PRICE (if Approved):       ${formatM((d.originalContractPrice || 0) + (d.coAmount || 0))}\n\n`
  doc += `6.1 NON-REFUNDABILITY OF PRIOR PAYMENTS. All sums paid by Customer to Contractor prior to the date of this Change Order represent compensation for labor performed, materials procured or installed, overhead, and professional services rendered through the date hereof. These amounts are fully earned and non-refundable.\n\n6.2 MATERIALS DEPOSIT REQUIRED BEFORE WORK BEGINS. The materials deposit shown above is required before Contractor will procure materials or commence work on this Change Order. No work on this Change Order will begin until the materials deposit is received in cleared funds.\n\n`
  doc += hr('SECTION 7 — SCHEDULE')
  doc += `${d.scheduleImpact ? `This Change Order extends schedule by ${d.scheduleDays} days.` : 'This Change Order does NOT affect schedule.'}\n\nWork is suspended pending Customer's written election. The project schedule shall be extended by the number of days suspended awaiting Customer's response, regardless of Customer's election.\n\n`
  doc += hr("SECTION 8 — CUSTOMER'S ELECTION (SIGN ONE OPTION ONLY)")
  doc += `Customer must sign ONE of the two blocks below and leave the other blank. Work does not proceed until Contractor receives a signed election.\n\n`
  doc += hr('OPTION A — CUSTOMER APPROVES — WORK PROCEEDS WITH CORRECTION')
  doc += `By signing below, Customer authorizes Contractor to perform the corrective work described in Section 4 at the Revised Contract Price in Section 6. Customer understands that: (a) Contractor will perform the corrective work before or concurrent with resuming the original scope; (b) Contractor's full warranty on both the corrective work and original scope remains in force; (c) The materials deposit shown in Section 6 must be received before work resumes; (d) All prior payments are earned and non-refundable.\n\nCUSTOMER APPROVAL SIGNATURE: _______________________________ Date ______________\nPrint Name: ____________________________________________________\n\n— OR —\n\n`
  doc += hr('OPTION B — CUSTOMER DECLINES — PROJECT TERMINATION')
  doc += `DECLINATION AND TERMINATION ACKNOWLEDGMENT\n\nBy signing below, Customer acknowledges and expressly agrees to each of the following: (a) Customer has been informed of the condition and consequences; (b) The identified condition prevents Contractor from proceeding; (c) Contractor CANNOT and WILL NOT proceed without correction; (d) Customer declines to authorize the corrective work; (e) Customer's declination constitutes Customer's election to terminate this Contract; (f) ALL PAYMENTS MADE BY CUSTOMER TO DATE — totaling ${formatM(d.totalPaidToDate || 0)} — ARE NON-REFUNDABLE; (g) The balance due for unpaid labor through the termination date is: $____________ — due within 5 calendar days; (h) No warranty of any kind is issued for any Work performed; (i) Customer releases and holds harmless Proline Residential LLC and its members, managers, employees, and agents from any and all claims arising from or related to the identified condition, Customer's declination, or the termination of this Contract.\n\nCUSTOMER DECLINATION SIGNATURE: _______________________________ Date ______________\nPrint Name: ____________________________________________________\n\n`
  doc += hr('SECTION 9 — CONTRACTOR ACKNOWLEDGMENT')
  doc += `CONTRACTOR — Proline Residential LLC\nAuthorized Signatory _______________________________ Date ______________\nPrint Name & Title: ____________________________________________________\n`
  return doc
}

export function generateCO03BText(d) {
  let doc = `PROLINE RESIDENTIAL LLC\nServing SC · NC · GA · TN · VA\n\nREQUIRED CHANGE ORDER — WARRANTY IMPACT DISCLOSURE\n\nDocument No.: ${d.coNum}\nDate: ${today()}\n\n`
  doc += `⚠ NOTICE TO CUSTOMER: Contractor has identified a condition that does not prevent the Work from proceeding but will prevent Contractor from issuing or honoring a warranty on the affected Work if left uncorrected. Customer may approve the corrective work or elect to proceed without warranty coverage on the affected portion. All payments made to date are non-refundable regardless of Customer's election.\n\n`
  doc += `⚠ RESPONSE DEADLINE: Customer must sign and return this Change Order within ${d.responseDays || 5} calendar days. Verbal communications will not be accepted.\n\n`
  doc += hr('SECTION 1 — REFERENCE INFORMATION')
  doc += `Original Contract No.: ${d.originalContractNum || '[CONTRACT-XXXX]'}\nChange Order No.: ${d.coNum}\nProject Address: ${d.projectAddress || ''}\nCustomer: ${d.customerName || ''}\nDate Issued: ${today()}\n\n`
  doc += hr('SECTION 2 — NATURE OF THIS CHANGE ORDER')
  doc += `During performance of the Work, Contractor identified the following condition. This condition does not create a life/safety, structural integrity, or code compliance issue that would prevent the Work from proceeding. However, if left uncorrected, it will prevent Contractor from issuing or honoring its warranty on the portion of the Work affected by this condition.\n\nCustomer has two options: (1) approve the corrective work — full warranty applies; or (2) decline — Work proceeds as originally scoped but NO WARRANTY of any kind will be issued or honored on any portion of the Work affected by the identified condition.\n\n`
  doc += hr('SECTION 3 — DESCRIPTION OF DISCOVERED CONDITION')
  doc += `${d.conditionDescription}\n\n`
  doc += hr('SECTION 4 — REQUIRED CORRECTIVE WORK')
  doc += `${d.correctiveWork}\n\n`
  doc += hr('SECTION 5 — WARRANTY IMPACT IF DECLINED')
  doc += `⚠ IF CUSTOMER DECLINES THIS CHANGE ORDER: No warranty — expressed or implied — will be issued or honored by Contractor for any portion of the Work affected by the identified condition. This applies to all failure types and all timing.\n\n${d.warrantyImpactDescription}\n\n`
  doc += hr('SECTION 6 — PAYMENT STATUS AND CONTRACT PRICE')
  doc += `⚠ ALL PAYMENTS MADE BY CUSTOMER PRIOR TO THE DATE OF THIS CHANGE ORDER ARE NON-REFUNDABLE.\n\nOriginal Contract Price:                    ${formatM(d.originalContractPrice || 0)}\nTotal Paid to Date:                         ${formatM(d.totalPaidToDate || 0)} — NON-REFUNDABLE\nThis Change Order Amount:                   ${formatM(d.coAmount || 0)}\nMaterials Deposit (if Approved):            ${formatM(d.materialsDeposit || 0)}\nREVISED CONTRACT PRICE (if Approved):       ${formatM((d.originalContractPrice || 0) + (d.coAmount || 0))}\n\n`
  doc += hr('SECTION 7 — SCHEDULE')
  doc += `${d.scheduleImpact ? `Extends schedule by ${d.scheduleDays} days.` : 'Does NOT affect schedule.'}\n\n`
  doc += hr("SECTION 8 — CUSTOMER'S ELECTION (SIGN ONE OPTION ONLY)")
  doc += hr('OPTION A — CUSTOMER APPROVES — FULL WARRANTY APPLIES')
  doc += `By signing below, Customer authorizes Contractor to perform the corrective work at the Revised Contract Price. Full warranty applies to all Work including the corrective scope.\n\nCUSTOMER APPROVAL: _______________________________ Date ______________\n\n— OR —\n\n`
  doc += hr('OPTION B — CUSTOMER DECLINES — WORK PROCEEDS WITHOUT WARRANTY ON AFFECTED PORTIONS')
  doc += `NO WARRANTY ELECTION AND ASSUMPTION OF RISK — CONTRACT CONTINUES\n\nBy signing below, Customer acknowledges: (a) Informed of the condition and its warranty impact; (b) No warranty — expressed or implied — will be issued or honored for any portion of the Work affected by the identified condition; (c) Customer assumes full risk of any future failure related to or arising from the identified condition; (d) All prior payments are earned and non-refundable; (e) Contract continues in full force and effect as to all other portions of the Work.\n\nCUSTOMER DECLINATION: _______________________________ Date ______________\n\n`
  doc += hr('SECTION 9 — CONTRACTOR ACKNOWLEDGMENT')
  doc += `CONTRACTOR — Proline Residential LLC\nAuthorized Signatory _______________________________ Date ______________\n`
  return doc
}

// ── Helpers ───────────────────────────────────────────────────────

function hr(title) {
  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${title}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
}

function formatM(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
}

function buildFullLatePay(fee, annualized) {
  return `3.2 LATE PAYMENT AND WORK CESSATION.\n\n(a) IMMEDIATE WORK CESSATION. If any payment is not received by Contractor on or before its due date, work shall cease immediately upon the due date without further notice. Work will not resume until payment is received in cleared funds. Customer agrees that work stoppage due to non-payment is not a breach by Contractor and does not entitle Customer to any claim for delay damages.\n\n(b) CREW REALLOCATION. If payment remains outstanding for more than five (5) calendar days past its due date and Contractor's crew has commenced work on another project site in the interim, Contractor's crew will not return to Customer's project until the newly commenced project is complete. Customer acknowledges this reallocation is a foreseeable consequence of non-payment and agrees Contractor bears no liability for the resulting delay.\n\n(c) INTEREST ON LATE PAYMENTS. Any payment not received within five (5) calendar days of its due date shall accrue interest at ${fee}% per month (${annualized}% per annum) from the original due date until paid in full.\n\n(d) DISPUTED AMOUNTS. Customer shall pay all undisputed amounts by their due date. If Customer disputes a portion of an invoice, Customer shall: (i) pay the undisputed portion timely; and (ii) provide written notice of the specific basis for the dispute within three (3) business days of receipt. The parties shall resolve disputes in good faith within ten (10) business days.`
}

function buildPermitArticle(d) {
  if (!d.includePermits) return ''
  const feeInclusion = d.permitFeesIncluded ? 'included in' : 'excluded from'
  const who = d.contractorPullsPermits
    ? `PERMIT ELECTION — CONTRACTOR WILL PULL PERMITS: Where permits are required by applicable law, Customer has elected for Contractor to apply for and obtain required permits. Permit fees are ${feeInclusion} the Contract Price. Customer shall cooperate with all permit and inspection requirements and provide reasonable access.`
    : `PERMIT ELECTION — CUSTOMER WILL PULL PERMITS: Customer has elected to apply for and obtain all required permits at Customer's sole expense. Contractor will proceed with the Work upon Customer's written confirmation that all required permits have been obtained. Contractor is not responsible for permit application, fees, or delays attributable to the permit process.`
  return `\n\n${hr('ARTICLE 6 — PERMITS, CODES, AND INSPECTIONS')}6.1 PERMIT REQUIREMENT. Permits will be pulled only as required by applicable local law and jurisdiction for the scope of Work described in this Agreement. Customer acknowledges that not all residential improvement work requires a permit, and Contractor does not represent that a permit is required for this specific project unless expressly stated in the Scope of Work.\n\n${who}\n\n6.2 CODE COMPLIANCE. All Work shall be performed in material compliance with applicable building codes in effect as of the permit issuance date (or as of the commencement of Work if no permit is required).\n\n6.3 INSPECTION ACCESS. Customer shall provide reasonable access to the Project Site for Contractor, subcontractors, and inspecting authorities throughout the project.\n\n6.4 PERMIT DELAYS. Delays caused by permit processing, inspection scheduling, or inspecting authority decisions are excusable delays and extend the project schedule accordingly without liability to Contractor.`
}
