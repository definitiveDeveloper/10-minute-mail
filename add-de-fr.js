const fs = require('fs');
const path = require('path');
const LOCALES = path.join(__dirname, 'frontend/src/locales');

const t = {
  de: {
    howItWorksHeadingPart1:"Drei Schritte zu einem",howItWorksHeadingGradient:"spamfreien Leben",howItWorksSubheading:"Kein Konto, kein Passwort, keine Konsequenzen.",
    step1Title:"Adresse erhalten",step1Description:"Ein einzigartiges, echtes Postfach erscheint in dem Moment, in dem Sie diese Seite öffnen. Keine Registrierung. Kein Formular. Nichts.",
    step2Title:"Überall verwenden",step2Description:"Fügen Sie es in jedes Anmeldeformular, Download-Portal oder Verifizierungsfeld ein. Echte E-Mails kommen in Sekunden an.",
    step3Title:"Beobachten, wie es verschwindet",step3Description:"Nach 10 Minuten werden die Adresse und alle Nachrichten dauerhaft gelöscht. Keine Spur. Kein Spam.",
    featuresHeadingPart1:"Gebaut für",featuresHeadingGradient:"echten Datenschutz",featuresSubheading:"Jede Funktion ist darauf ausgelegt, Sie vor Spam, Trackern und Datenerfassung zu schützen.",
    feature1Title:"Sofortiger Datenschutz",feature1Description:"Kein Login, kein Konto, keine persönlichen Daten werden erfasst. Ihre Privatsphäre ist das Produkt.",
    feature2Title:"Echter Posteingang",feature2Description:"Echte SMTP-Zustellung. Wenn Ihre E-Mail hier ankommt, funktioniert sie überall.",
    feature3Title:"Sitzungsgebunden",feature3Description:"Ihr Posteingang ist für die gesamte Sitzung an Ihre IP gebunden. Niemand sonst kann darauf zugreifen.",
    feature4Title:"Automatisches Ablaufen",feature4Description:"Adresse und alle Nachrichten werden dauerhaft gelöscht, wenn Ihre Sitzung endet.",
    feature5Title:"Funktioniert überall",feature5Description:"Von 99% der Dienste akzeptiert. Perfekt für Tests, Downloads und einmalige Verifizierungen.",
    feature6Title:"Verlängerbar",feature6Description:"Brauchen Sie mehr Zeit? Klicken Sie in den letzten 2 Minuten auf '+10 Minuten', um den Timer zurückzusetzen.",
    statEmailsGenerated:"Generierte E-Mails",statTimeToStart:"Zeit zum Starten",statAnonymousFree:"Anonym und kostenlos",statCountriesServed:"Bediente Länder",statDeliveryTime:"E-Mail-Zustellzeit",
    faqHeadingPart1:"Häufig gestellte",faqHeadingGradient:"Fragen",faqSubheading:"Alles, was Sie über 10 Minute Mail wissen müssen.",
    faq1Q:"Was ist 10 Minute Mail?",faq1A:"10 Minute Mail ist ein kostenloser Wegwerf-E-Mail-Dienst, der sofort eine echte, funktionsfähige E-Mail-Adresse ohne Registrierung generiert. Die Adresse ist 10 Minuten lang aktiv, danach werden sie und alle empfangenen Nachrichten dauerhaft gelöscht.",
    faq2Q:"Muss ich ein Konto erstellen?",faq2A:"Nein. Es ist keine Registrierung, kein Passwort und keine persönlichen Daten erforderlich. Ihre temporäre Adresse wird beim Öffnen der Seite automatisch generiert.",
    faq3Q:"Wie lange ist die Adresse gültig?",faq3A:"10 Minuten ab dem Zeitpunkt der Generierung. Mit einem Klick können Sie sie um weitere 10 Minuten verlängern, so oft Sie möchten.",
    faq4Q:"Ist mein Posteingang privat?",faq4A:"Ja, vollständig. Ihr Posteingang ist für die gesamte Sitzung an Ihre IP-Adresse gebunden; niemand sonst kann Ihre Nachrichten einsehen oder abfangen.",
    faq5Q:"Wofür kann ich eine temporäre E-Mail verwenden?",faq5A:"Anmeldeformulare, Aktivierungen kostenloser Testversionen, Software-Downloads, E-Book-Zugang, Gewinnspiele, Gutschein-Codes, Forum-Registrierungen, App-Verifizierungscodes.",
    faq6Q:"Kann ich Anhänge empfangen?",faq6A:"Ja. Anhänge, die an Ihre temporäre Adresse gesendet werden, werden in Ihrem Posteingang zugestellt und sind während der Sitzung sichtbar. Sie werden beim Ende der Sitzung dauerhaft gelöscht.",
    faq7Q:"Ist 10 Minute Mail kostenlos?",faq7A:"100%. Keine Pläne, keine Credits, keine Bezahlschranken. Der Dienst ist völlig kostenlos und wird es bleiben.",
    faq8Q:"Ist der Dienst DSGVO-konform?",faq8A:"Ja. Wir erheben keine personenbezogenen Daten. Keine Tracking-Cookies, keine E-Mail-Daten werden nach der Sitzung gespeichert. Vollständige Einhaltung der DSGVO, CCPA und gleichwertiger globaler Rahmen.",
    faq9Q:"Was passiert, wenn der Timer abläuft?",faq9A:"Wenn Sie Ihre Sitzung nicht verlängert haben, wird automatisch eine neue E-Mail-Adresse zugewiesen. Nachrichten der alten Adresse werden gelöscht. Wenn Sie vor Ablauf der Zeit auf '10 Minuten mehr' klicken, wird Ihre aktuelle Adresse um weitere 10 Minuten verlängert.",
    faq10Q:"Welche E-Mail-Domains werden verwendet?",faq10A:"Wir rotieren zwischen mehreren Domains, die dynamisch aus unserer Infrastruktur bezogen werden. Die Domains werden regelmäßig gewechselt, um das Blocklisting auf Websites, die Wegwerf-E-Mail-Domains blockieren, zu minimieren.",
    blogHeadingPart1:"Datenschutz-Ratgeber &",blogHeadingGradient:"Ressourcen",blogSubheading:"Expertenratgeber zu E-Mail-Datenschutz, Spam-Schutz und digitaler Sicherheit.",
    blogReadArticle:"Artikel lesen ↓",blogCollapse:"Einklappen ↑",
    generatingMailbox:"Ihr sicheres Postfach wird erstellt…",newAddressButton:"Neue Adresse",ipLockedBadge:"Ihr Postfach ist für diese Sitzung IP-gesperrt",
    assigningIn:"Neue E-Mail wird in {{count}}s zugewiesen…",newEmailAssigning:"Ihre neue E-Mail-Adresse wird zugewiesen…"
  },
  fr: {
    howItWorksHeadingPart1:"Trois étapes vers une",howItWorksHeadingGradient:"vie sans spam",howItWorksSubheading:"Pas de compte, pas de mot de passe, pas de conséquences.",
    step1Title:"Obtenez votre adresse",step1Description:"Une boîte aux lettres unique et réelle apparaît dès que vous ouvrez cette page. Pas d'inscription. Pas de formulaire. Rien.",
    step2Title:"Utilisez-la partout",step2Description:"Collez-la dans n'importe quel formulaire d'inscription, portail de téléchargement ou champ de vérification. Les vrais e-mails arrivent en quelques secondes.",
    step3Title:"Regardez-la disparaître",step3Description:"Après 10 minutes, l'adresse et tous les messages sont définitivement supprimés. Sans trace. Sans spam.",
    featuresHeadingPart1:"Conçu pour la",featuresHeadingGradient:"vraie confidentialité",featuresSubheading:"Chaque fonctionnalité est conçue pour vous protéger contre le spam, les trackers et la collecte de données.",
    feature1Title:"Confidentialité instantanée",feature1Description:"Pas de connexion, pas de compte, aucune donnée personnelle collectée. Votre vie privée est le produit.",
    feature2Title:"Vraie boîte de réception",feature2Description:"Livraison SMTP réelle. Si votre e-mail arrive ici, il fonctionne partout.",
    feature3Title:"Verrouillé par session",feature3Description:"Votre boîte de réception est liée à votre IP pendant toute la session. Personne d'autre ne peut y accéder.",
    feature4Title:"Expiration automatique",feature4Description:"L'adresse et tous les messages sont définitivement supprimés à la fin de votre session.",
    feature5Title:"Fonctionne partout",feature5Description:"Accepté par 99% des services. Parfait pour les essais, les téléchargements et les vérifications ponctuelles.",
    feature6Title:"Extensible",feature6Description:"Besoin de plus de temps ? Cliquez sur '+10 minutes' dans les 2 dernières minutes pour réinitialiser le minuteur.",
    statEmailsGenerated:"E-mails générés",statTimeToStart:"Temps pour commencer",statAnonymousFree:"Anonyme et gratuit",statCountriesServed:"Pays desservis",statDeliveryTime:"Délai de livraison",
    faqHeadingPart1:"Questions",faqHeadingGradient:"fréquentes",faqSubheading:"Tout ce que vous devez savoir sur 10 Minute Mail.",
    faq1Q:"Qu'est-ce que 10 Minute Mail ?",faq1A:"10 Minute Mail est un service gratuit d'e-mail jetable qui génère instantanément une adresse e-mail réelle et fonctionnelle sans inscription. L'adresse est active pendant 10 minutes, après quoi elle et tous les messages reçus sont définitivement supprimés.",
    faq2Q:"Dois-je créer un compte ?",faq2A:"Non. Aucune inscription, mot de passe ou donnée personnelle n'est requise. Votre adresse temporaire est générée automatiquement à l'ouverture de la page.",
    faq3Q:"Combien de temps l'adresse est-elle valide ?",faq3A:"10 minutes à partir de la génération. En un clic, vous pouvez la prolonger de 10 minutes supplémentaires, autant de fois que vous le souhaitez.",
    faq4Q:"Ma boîte de réception est-elle privée ?",faq4A:"Oui, complètement. Votre boîte de réception est liée à votre adresse IP pendant toute la session ; personne d'autre ne peut consulter ou intercepter vos messages.",
    faq5Q:"À quoi puis-je utiliser un e-mail temporaire ?",faq5A:"Formulaires d'inscription, activations d'essais gratuits, téléchargements de logiciels, accès aux e-books, concours, codes de réduction, inscriptions sur des forums, codes de vérification d'applications.",
    faq6Q:"Puis-je recevoir des pièces jointes ?",faq6A:"Oui. Les pièces jointes envoyées à votre adresse temporaire sont livrées dans votre boîte de réception et visibles pendant votre session. Elles sont définitivement supprimées à la fin de la session.",
    faq7Q:"10 Minute Mail est-il gratuit ?",faq7A:"100%. Pas d'abonnements, pas de crédits, pas de barrières payantes. Le service est entièrement gratuit et le restera.",
    faq8Q:"Le service est-il conforme au RGPD ?",faq8A:"Oui. Nous ne collectons aucune information personnellement identifiable. Pas de cookies de suivi, aucune donnée e-mail conservée après la session. Conformité totale avec le RGPD, le CCPA et les cadres mondiaux équivalents.",
    faq9Q:"Que se passe-t-il quand le minuteur expire ?",faq9A:"Si vous n'avez pas prolongé votre session, une nouvelle adresse e-mail est automatiquement attribuée. Les messages de l'ancienne adresse sont supprimés. Si vous cliquez sur '10 minutes de plus' avant la fin du temps, votre adresse actuelle continue pendant 10 minutes supplémentaires.",
    faq10Q:"Quels domaines d'e-mail sont utilisés ?",faq10A:"Nous alternons entre plusieurs domaines obtenus dynamiquement de notre infrastructure. Les domaines sont changés périodiquement pour minimiser le blocage par les sites qui bloquent les domaines d'e-mails jetables connus.",
    blogHeadingPart1:"Guides de confidentialité &",blogHeadingGradient:"Ressources",blogSubheading:"Guides d'experts sur la confidentialité des e-mails, la protection anti-spam et la sécurité numérique.",
    blogReadArticle:"Lire l'article ↓",blogCollapse:"Réduire ↑",
    generatingMailbox:"Génération de votre boîte sécurisée…",newAddressButton:"Nouvelle adresse",ipLockedBadge:"Votre boîte aux lettres est verrouillée par IP pour cette session",
    assigningIn:"Nouvel e-mail attribué dans {{count}}s…",newEmailAssigning:"Attribution de votre nouvelle adresse e-mail…"
  }
};

for (const [lang, keys] of Object.entries(t)) {
  const fp = path.join(LOCALES, lang + '.json');
  try {
    const existing = JSON.parse(fs.readFileSync(fp, 'utf8'));
    fs.writeFileSync(fp, JSON.stringify({...existing, ...keys}, null, 2), 'utf8');
    console.log('Updated', lang);
  } catch(e) { console.error('Failed', lang, e.message); }
}
console.log('Done.');
