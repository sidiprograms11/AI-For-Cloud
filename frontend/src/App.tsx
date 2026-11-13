import { useState, type ReactNode } from 'react'

type View = 'overview' | 'project' | 'comparison' | 'report'
type IconName = 'home' | 'edit' | 'compare' | 'file' | 'arrow' | 'check' | 'spark' | 'shield'

const navigation: { id: View; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Vue d’ensemble', icon: 'home' },
  { id: 'project', label: 'Décrire un besoin', icon: 'edit' },
  { id: 'comparison', label: 'Comparaison cloud', icon: 'compare' },
  { id: 'report', label: 'Dossier technique', icon: 'file' },
]

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z" /></>,
    compare: <><rect x="3" y="4" width="7" height="16" rx="1.5" /><rect x="14" y="4" width="7" height="16" rx="1.5" /><path d="M5.5 9h2M16.5 9h2M5.5 13h2M16.5 13h2" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    arrow: <><path d="M4 12h16M13 5l7 7-7 7" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    spark: <><path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6Z" /><path d="m19 17 .5 2 2 .5-2 .5-.5 2-.5-2-2-.5 2-.5Z" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></>,
  }

  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function Brand() {
  return <div className="brand-lockup"><span className="brand-emblem">k<span>.</span></span><span className="brand-name">kora<span>AI for Cloud</span></span></div>
}

function Topline({ view }: { view: View }) {
  return <div className="topline"><div className="breadcrumbs"><span>Espace de travail</span><span className="crumb-slash">/</span><strong>{navigation.find((item) => item.id === view)?.label}</strong></div><div className="topline-right"><span className="live-dot" />Prototype visuel <span className="topline-divider" /><span className="avatar">CS</span></div></div>
}

function ArchitecturePreview() {
  return <div className="architecture-preview" aria-label="Aperçu schématique du parcours Kora"><div className="preview-top"><span className="preview-window-dots"><i /><i /><i /></span><span>Aperçu du parcours</span><span className="preview-window-mark">↗</span></div><div className="preview-content"><div className="preview-node preview-input"><span className="node-symbol">01</span><span><strong>Votre besoin</strong><small>Contexte · contraintes · budget</small></span></div><div className="preview-connector" /><div className="preview-node preview-kora"><span className="node-symbol kora-symbol">k.</span><span><strong>Analyse Kora</strong><small>Critères & sources vérifiables</small></span></div><div className="preview-connector" /><div className="preview-providers"><span>AWS</span><span>Azure</span><span>Google Cloud</span></div><p className="preview-caption">Une même grille pour trois fournisseurs</p></div></div>
}

function Overview({ navigate }: { navigate: (view: View) => void }) {
  return <>
    <section className="hero"><div className="hero-copy"><span className="hero-eyebrow"><Icon name="spark" size={15} /> Votre copilote pour le cloud</span><h1>Des choix cloud<br /><em>plus clairs.</em></h1><p>Une interface pensée pour transformer un besoin d’entreprise en architecture expliquée, avec ses hypothèses et ses sources.</p><div className="hero-actions"><button className="button button-light" onClick={() => navigate('project')}>Explorer le parcours <Icon name="arrow" size={17} /></button><button className="button button-ghost" onClick={() => navigate('report')}>Voir le dossier</button></div></div><ArchitecturePreview /><div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" /></section>

    <div className="prototype-callout"><span className="callout-icon">i</span><span><strong>Premier aperçu de l’interface.</strong> Les écrans ci-dessous illustrent le futur parcours. Les exemples sont fictifs et aucune recommandation n’est calculée.</span></div>

    <section className="section-block"><div className="section-heading"><div><span className="kicker">UN PARCOURS SIMPLE</span><h2>Du besoin au dossier technique</h2></div><span className="section-suffix">01 — 03</span></div><div className="journey-grid"><button className="journey-card" onClick={() => navigate('project')}><span className="journey-number">01</span><div className="journey-icon purple"><Icon name="edit" size={21} /></div><h3>Décrire votre projet</h3><p>Usage, données, budget et contraintes dans un langage accessible.</p><span className="journey-link">Voir l’écran <Icon name="arrow" size={15} /></span></button><button className="journey-card" onClick={() => navigate('comparison')}><span className="journey-number">02</span><div className="journey-icon blue"><Icon name="compare" size={21} /></div><h3>Comparer les options</h3><p>AWS, Azure et Google Cloud examinés avec les mêmes critères.</p><span className="journey-link">Voir l’écran <Icon name="arrow" size={15} /></span></button><button className="journey-card" onClick={() => navigate('report')}><span className="journey-number">03</span><div className="journey-icon mint"><Icon name="file" size={21} /></div><h3>Comprendre le résultat</h3><p>Une proposition lisible, des alternatives et des points à confirmer.</p><span className="journey-link">Voir l’écran <Icon name="arrow" size={15} /></span></button></div></section>

    <section className="overview-bottom"><div className="surface example-surface"><div className="surface-header"><span className="kicker">EXEMPLE FICTIF</span><span className="small-tag">Cas de démonstration</span></div><h2>Une PME lance une application Web</h2><p>Cette fiche montre le type d’informations que Kora devra clarifier avant toute comparaison.</p><div className="fact-grid"><div><span>Application</span><strong>Plateforme Web</strong></div><div><span>Données</span><strong>Base PostgreSQL</strong></div><div><span>Charge</span><strong>À préciser</strong></div><div><span>Budget</span><strong>À préciser</strong></div></div></div><div className="surface principles-surface"><div className="principle-icon"><Icon name="shield" size={22} /></div><span className="kicker">CONFIANCE & LISIBILITÉ</span><h2>Comprendre chaque choix</h2><p>Le dossier final devra distinguer faits documentés, hypothèses et informations encore inconnues.</p><ul className="check-list"><li><Icon name="check" size={16} /> Sources consultables</li><li><Icon name="check" size={16} /> Alternatives expliquées</li><li><Icon name="check" size={16} /> Coûts et limites visibles</li></ul></div></section>
  </>
}

function PageIntro({ eyebrow, title, description, badge }: { eyebrow: string; title: string; description: string; badge: string }) {
  return <section className="page-intro"><div><span className="kicker">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><span className="page-badge">{badge}</span></section>
}

function Project({ navigate }: { navigate: (view: View) => void }) {
  return <>
    <PageIntro eyebrow="ÉTAPE 01 · LE BESOIN" title="Parlons de votre projet." description="Cet écran illustre les informations que l’assistant recueillera pour comprendre votre contexte." badge="Maquette non connectée" />
    <div className="prototype-callout compact"><span className="callout-icon">i</span><span>Les champs sont illustratifs. Les données saisies ici ne sont ni envoyées ni enregistrées.</span></div>
    <div className="form-layout"><section className="surface form-surface"><div className="form-title"><span className="form-step">1</span><div><h2>Les premières informations</h2><p>Un point de départ, avant les questions de clarification.</p></div></div><div className="field-grid"><label className="field"><span>Type de projet</span><select defaultValue="web"><option value="web">Application Web</option><option value="mobile">Application mobile</option><option value="data">Traitement de données</option></select></label><label className="field"><span>Nombre d’utilisateurs</span><input placeholder="Ex. 500 utilisateurs" /></label><label className="field"><span>Localisation souhaitée</span><input placeholder="Ex. Union européenne" /></label><label className="field"><span>Budget mensuel</span><input placeholder="Montant et devise à préciser" /></label></div><label className="field field-wide"><span>Décrivez votre besoin avec vos mots</span><textarea placeholder="Nous souhaitons héberger une application Web avec une base de données, pour nos équipes et nos clients…" rows={5} /></label><div className="form-bottom"><span>Prototype visuel · aucune analyse ne sera lancée</span><button className="button button-primary" onClick={() => navigate('comparison')}>Voir l’étape suivante <Icon name="arrow" size={17} /></button></div></section><aside className="side-stack"><div className="surface guidance-card"><div className="guidance-icon"><Icon name="spark" size={21} /></div><h3>Ce que Kora précisera</h3><p>Une question utile apparaît lorsqu’une information manque pour comparer les options.</p><ul><li>Disponibilité attendue</li><li>Sensibilité des données</li><li>Sauvegarde et restauration</li><li>Compétences de l’équipe</li></ul></div><div className="surface note-card"><span className="kicker">EXEMPLE D’ÉTAT</span><h3>Informations à confirmer</h3><p>Les champs inconnus resteront visibles. Ils ne deviendront pas des hypothèses silencieuses.</p></div></aside></div>
  </>
}

const providers = [
  { name: 'Amazon Web Services', short: 'AWS', className: 'aws' },
  { name: 'Microsoft Azure', short: 'Azure', className: 'azure' },
  { name: 'Google Cloud', short: 'GCP', className: 'gcp' },
]

function Comparison({ navigate }: { navigate: (view: View) => void }) {
  return <>
    <PageIntro eyebrow="ÉTAPE 02 · COMPARAISON" title="Trois clouds. Une même grille." description="L’interface future mettra les options en regard des contraintes réelles de l’entreprise." badge="Comparaison illustrative" />
    <div className="comparison-criteria surface"><div><span className="kicker">CRITÈRES À EXAMINER</span><h2>Ce qui compte pour votre projet</h2></div><div className="criteria-chips"><span>Budget</span><span>Localisation</span><span>Disponibilité</span><span>Compétences</span></div></div>
    <div className="provider-grid">{providers.map((provider) => <div className="surface provider-card" key={provider.short}><div className="provider-top"><span className={`provider-logo ${provider.className}`}>{provider.short.slice(0, 1)}</span><span className="provider-status">À évaluer</span></div><h2>{provider.name}</h2><p>Les services seront examinés selon le même besoin et avec des sources vérifiées.</p><div className="provider-rows"><div><span>Hébergement applicatif</span><strong>À documenter</strong></div><div><span>Base PostgreSQL</span><strong>À documenter</strong></div><div><span>Réseau & accès</span><strong>À documenter</strong></div><div><span>Coûts & exploitation</span><strong>À documenter</strong></div></div></div>)}</div>
    <div className="comparison-footer surface"><div className="comparison-footer-icon"><Icon name="shield" size={21} /></div><div><strong>Aucun fournisseur n’est favorisé par défaut.</strong><p>Une recommandation ne sera affichée que si les critères, hypothèses et sources permettent de la justifier.</p></div><button className="button button-primary" onClick={() => navigate('report')}>Aperçu du dossier <Icon name="arrow" size={16} /></button></div>
  </>
}

function Report() {
  return <>
    <PageIntro eyebrow="ÉTAPE 03 · RESTITUTION" title="Un dossier fait pour être compris." description="Voici la structure visuelle du dossier que Kora produira après analyse et vérification." badge="Aucun dossier généré" />
    <div className="report-layout"><article className="surface report-document"><div className="document-head"><div className="document-logo">k.</div><span>AI FOR CLOUD <span className="document-separator">/</span> DOSSIER TECHNIQUE</span><span className="document-preview">APERÇU</span></div><div className="document-title"><span>Exemple fictif de présentation</span><h2>Projet d’application Web</h2><p>Cette page présente la mise en forme prévue. Elle ne contient aucune recommandation calculée.</p></div><div className="document-section"><span className="document-index">01</span><div><h3>Synthèse du besoin</h3><p>Contexte, contraintes techniques et points encore inconnus seront résumés ici pour validation.</p></div></div><div className="document-section"><span className="document-index">02</span><div><h3>Options cloud examinées</h3><div className="document-clouds"><span>AWS</span><span>Microsoft Azure</span><span>Google Cloud</span></div><p>Une même grille de critères permettra d’expliquer les compromis sans imposer un gagnant.</p></div></div><div className="document-section"><span className="document-index">03</span><div><h3>Architecture & sécurité</h3><div className="diagram-placeholder"><span>Application</span><span className="diagram-line" /><span>Services cloud</span><span className="diagram-line" /><span>Données</span></div><p>Les composants, accès, sauvegardes et hypothèses de dimensionnement apparaîtront ici.</p></div></div><div className="document-section"><span className="document-index">04</span><div><h3>Coûts, sources & limites</h3><p>La méthode d’estimation, les références consultables et les confirmations nécessaires seront indiquées.</p></div></div><div className="document-end">Prototype visuel · Aucun export disponible</div></article><aside className="side-stack report-side"><div className="surface guidance-card"><span className="kicker">AVANT UNE DÉCISION</span><h3>Ce qu’il faudra vérifier</h3><ul className="report-checks"><li><span>01</span> Sources à jour</li><li><span>02</span> Région et disponibilité</li><li><span>03</span> Hypothèses de charge</li><li><span>04</span> Méthode de coût</li></ul></div><div className="surface note-card"><Icon name="shield" size={22} /><h3>Résultat responsable</h3><p>Une donnée manquante ou une affirmation sans preuve restera signalée comme telle.</p></div></aside></div>
  </>
}

export default function App() {
  const [view, setView] = useState<View>('overview')
  const navigate = (next: View) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return <div className="app-shell"><aside className="sidebar"><Brand /><div className="workspace-label">ESPACE DE TRAVAIL</div><nav className="sidebar-nav" aria-label="Navigation principale">{navigation.map((item) => <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)} aria-current={view === item.id ? 'page' : undefined}><Icon name={item.icon} size={18} /><span>{item.label}</span>{view === item.id && <span className="nav-active-dot" />}</button>)}</nav><div className="sidebar-spacer" /><div className="sidebar-help"><div className="sidebar-help-icon"><Icon name="spark" size={17} /></div><strong>Une première vision</strong><p>Explorez la forme que prendra l’interface Kora.</p><span>Prototype visuel</span></div><div className="sidebar-foot"><span className="sidebar-foot-avatar">CS</span><span>Équipe CSIG<small>Projet de fin d’études</small></span></div></aside><div className="main-column"><Topline view={view} /><main className="main-content">{view === 'overview' && <Overview navigate={navigate} />}{view === 'project' && <Project navigate={navigate} />}{view === 'comparison' && <Comparison navigate={navigate} />}{view === 'report' && <Report />}</main><footer className="site-footer"><span>© AI for Cloud · Kora</span><span>Prototype de présentation · Efrei CSIG</span></footer></div></div>
}
