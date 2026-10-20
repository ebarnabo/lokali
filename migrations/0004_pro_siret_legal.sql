-- Identité des commerces et textes légaux PDC DESIGN.
-- Aucun SIRET, siège ou capital n'est inventé pour l'éditeur.

alter table profiles add column if not exists siret text not null default '';
alter table profiles add column if not exists legal_form text not null default '';
alter table profiles add column if not exists activity text not null default '';
alter table profiles add column if not exists manager_name text not null default '';

insert into legal_pages (slug, title, body) values
  ('mentions-legales', 'Mentions légales', $lokali$
Lokali est un projet édité par PDC DESIGN.

1. Éditeur
Le site Lokali (le « Site ») est édité par PDC DESIGN (l'« Éditeur »).
PDC DESIGN met à disposition un annuaire de proximité et un espace d'entraide. PDC DESIGN n'est pas le vendeur des produits affichés, n'encaisse aucun paiement sur le Site et n'est pas partie aux échanges entre habitants et commerces.

Dénomination : PDC DESIGN
Directeur de la publication : le représentant légal de PDC DESIGN
Siège, forme juridique, capital social, numéro SIRET, RCS et TVA : ceux de PDC DESIGN. Ils seront inscrits dans ce paragraphe par l'administrateur dès qu'ils sont arrêtés. Tant qu'ils n'y figurent pas, ils ne doivent pas être déduits d'une autre entreprise au nom proche.
Contact : l'adresse électronique que PDC DESIGN publie dans cette phrase, ou, à défaut, un message depuis un compte connecté à destination de l'administration du Site.

2. Hébergement
Le Site est hébergé par le prestataire d'infrastructure choisi par l'Éditeur. Cet hébergeur peut être Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, États-Unis (https://www.netlify.com), ou un successeur. Un changement d'hébergeur ne change pas la nature du service.

3. Objet
Lokali permet de consulter des offres saisies par des comptes professionnels et de déposer des annonces d'entraide, visibles après modération. C'est un outil d'information. Ce n'est pas une place de marché avec paiement, ni un service de livraison, ni une garantie de stock, de prix ou d'horaires.

4. Propriété intellectuelle
La structure du Site, le nom Lokali, les textes de l'Éditeur et l'interface sont protégés. Toute reproduction non autorisée est interdite.
Les contenus déposés par les utilisateurs restent leur propriété. Ils concèdent à PDC DESIGN une licence non exclusive, gratuite, mondiale, limitée à l'hébergement, l'affichage, la modération et la sauvegarde, pour la durée de la publication.

5. Responsabilité
Le nom du commerce, le SIRET, l'adresse, les prix, les disponibilités et les contacts sont fournis par les comptes professionnels, sous leur seule responsabilité. PDC DESIGN ne vérifie pas en temps réel l'exactitude du SIRET, l'ouverture du magasin, la qualité, la sécurité ou la légalité des produits.
L'Éditeur n'est pas responsable d'une erreur ou d'une omission dans une offre ou une annonce, d'un défaut de stock, d'un prix ou d'une adresse inexacts, d'un litige entre utilisateurs, ni d'une indisponibilité due au réseau, à l'hébergeur, à un cyclone, à un barrage routier ou à un autre événement extérieur.
La carte est indicative. Le géocodage peut provenir d'OpenStreetMap et ne remplace pas une vérification sur place.
Rien ici n'écarte une responsabilité que la loi française interdit d'exclure, notamment en cas de dol, de faute lourde ou de dommage corporel.

6. Liens
Un lien vers un téléphone, un email ou une carte ne vaut pas approbation du service tiers.

7. Droit applicable
Droit français. Sous réserve des règles d'ordre public qui protègent le consommateur, les tribunaux du ressort de Pointe-à-Pitre sont compétents.

Dernière mise à jour : octobre 2026.
$lokali$),
  ('confidentialite', 'Confidentialité', $lokali$
Politique de confidentialité de Lokali, projet de PDC DESIGN.

1. Responsable de traitement
PDC DESIGN est responsable des traitements décrits ici.
Contact : l'adresse publiée dans les mentions légales ou, à défaut, un message depuis un compte connecté vers l'administration du Site.

2. Données utilisées
Selon les cas :
- compte : nom, email de connexion, mot de passe conservé uniquement sous forme d'empreinte, identifiant technique ;
- particulier : nom affiché ;
- professionnel : enseigne, SIRET, forme juridique, activité, nom du responsable (non publié), adresse, commune, coordonnées éventuelles, description, téléphone et email seulement si leur affichage est coché, produits et prix saisis ;
- entraide : titre, texte, catégorie, statut de modération et motif éventuel ;
- technique : traces utiles à la sécurité, cookie de session nécessaire à la connexion.
Aucune donnée bancaire n'est demandée. Il n'y a pas de paiement sur le Site.

3. Pourquoi
- compte, profil et affichage des offres : exécution des conditions d'utilisation ;
- modération et retrait d'un contenu manifestement illicite : intérêt légitime et, le cas échéant, obligation légale ;
- sécurité, limitation des abus, lutte contre l'usurpation d'un commerce : intérêt légitime ;
- placement d'une adresse sur la carte : intérêt légitime ;
- réponse à une demande de droits : obligation légale.
Le SIRET, le nom du commerce et l'adresse sont nécessaires pour apparaître comme commerce. Le reste du Site peut être consulté sans compte.

4. Qui y accède
Les données ne sont pas vendues. Y accèdent PDC DESIGN et les personnes habilitées à l'administration, l'hébergeur en tant que sous-traitant technique, le service de géocodage (l'adresse lui est envoyée pour obtenir un point), les visiteurs pour les seules informations rendues publiques, et les autorités sur demande légale.
Le SIRET est affiché : c'est un identifiant public d'entreprise. Le nom du responsable ne l'est pas. L'email de connexion ne l'est pas. Le téléphone et l'email publics ne le sont que si la case correspondante est cochée.

5. Hors Union européenne
L'hébergeur peut être situé aux États-Unis. Le transfert est alors encadré par les garanties prévues par le RGPD, notamment les clauses contractuelles types de la Commission européenne ou un mécanisme équivalent en vigueur. Le géocodage peut aussi être traité par l'infrastructure d'OpenStreetMap.

6. Durées
Compte et profil : pendant la vie du compte, puis suppression ou anonymisation dans un délai raisonnable après demande, sous réserve des traces nécessaires à un abus avéré, au plus douze mois après clôture sauf obligation plus longue.
Annonces : jusqu'à suppression par l'auteur ou retrait par la modération.
Journaux techniques : quelques mois, le temps utile à la sécurité.
Cookie de session : le temps de la session ou la durée technique du cookie d'authentification.

7. Cookies
Seul un cookie strictement nécessaire à la connexion est utilisé. Lokali ne dépose pas de cookie publicitaire ni de mesure d'audience tierce. Ce cookie essentiel ne demande pas de bandeau de consentement.

8. Vos droits
Vous pouvez demander l'accès, la rectification, l'effacement, la limitation, la portabilité des données que vous avez fournies, et vous opposer à un traitement fondé sur l'intérêt légitime pour un motif tenant à votre situation. Vous pouvez aussi définir des directives sur le sort de vos données après la mort.
Depuis le compte, vous pouvez corriger une fiche, retirer un contact public ou supprimer une annonce.
Une preuve d'identité peut être demandée en cas de doute légitime. La réponse intervient dans un délai d'un mois, prolongeable selon la complexité.
Réclamation : CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, www.cnil.fr.

9. Sécurité et mineurs
Les mots de passe ne sont pas stockés en clair. Aucune mesure n'est infaillible. Si une violation présente un risque élevé pour les personnes, elles et la CNIL seront informées lorsque la loi l'exige.
Le service s'adresse à des personnes capables de contracter. Un mineur ne crée pas de compte sans l'accord du titulaire de l'autorité parentale.

10. Mise à jour
La version publiée sur le Site prévaut. Octobre 2026.
$lokali$),
  ('cgu', 'Conditions d''utilisation', $lokali$
Conditions d'utilisation de Lokali, projet édité par PDC DESIGN. Octobre 2026.

1. Acceptation
Créer un compte ou publier un contenu vaut acceptation des présentes conditions, des mentions légales et de la politique de confidentialité. À défaut d'acceptation, les fonctions de publication ne doivent pas être utilisées. La consultation reste possible.

2. Rôle de PDC DESIGN
Lokali est un annuaire gratuit et un espace d'entraide, sans paiement en ligne.
PDC DESIGN n'achète pas, ne vend pas et ne livre pas les produits annoncés. PDC DESIGN n'est pas partie au contrat qui pourrait être conclu entre un visiteur et un commerce, ni entre auteurs d'annonces, et ne prend aucune commission sur ces échanges.
PDC DESIGN ne garantit ni la disponibilité d'un produit, ni son prix, ni sa conformité, ni l'ouverture d'un commerce. Toute suite se fait directement entre les personnes concernées, hors du Site, à leurs risques.

3. Comptes
Les informations de compte doivent être exactes. Le mot de passe reste secret. Jusqu'au signalement d'un usage non autorisé, les actions faites depuis le compte sont présumées le fait de son titulaire.
PDC DESIGN peut refuser, suspendre ou supprimer un compte en cas de manquement, d'usurpation ou de risque pour les autres personnes. Le service est gratuit : cette mesure n'ouvre pas droit à remboursement.

4. Comptes professionnels
Le compte pro est réservé à une personne habilitée à présenter le commerce. Elle fournit une enseigne, un SIRET valide correspondant à l'établissement ou à l'entreprise, la forme juridique, l'activité, et une adresse en Guadeloupe.
Le SIRET est publié. Le nom du responsable ne l'est pas.
Inventer un SIRET, usurper un commerce ou présenter une offre comme officielle alors qu'elle ne l'est pas est interdit.
Le professionnel est seul responsable de sa conformité : prix, information du consommateur, hygiène, allégations, droits sur les textes. PDC DESIGN ne donne aucun conseil juridique, fiscal ou sanitaire, et ne certifie pas la fiche.

5. Entraide
Les annonces sont écrites par les comptes, pro ou particuliers. Elles ne sont publiques qu'après une validation manuelle.
Cette lecture est une mesure de prudence. Ce n'est ni une certification, ni une obligation de résultat, ni la preuve que tout contenu illicite aura été arrêté avant diffusion. Un outil pourra plus tard aider à lire les textes. Il ne publiera pas à la place de l'Éditeur.
Un téléphone ou un email écrit dans une annonce ne doit l'être que si son auteur accepte qu'il devienne public après validation.

6. Interdits
Sont interdits les contenus faux ou trompeurs, les insultes, diffamations, menaces, appels à la haine ou discriminations, les données personnelles d'un tiers sans droit, les contenus illicites, le spam et la publicité pour une enseigne qui n'est pas celle du compte.
PDC DESIGN peut retirer un contenu, masquer un produit, refuser une annonce et laisser le motif visible par l'auteur.

7. Carte
Sans coordonnées saisies, l'adresse peut être envoyée à un géocodeur pour un placement indicatif en Guadeloupe. Une adresse introuvable n'empêche pas l'enregistrement. Le commerce peut alors être absent de la carte.

8. Disponibilité
Le Site est fourni en l'état. Aucun fonctionnement continu n'est promis, en particulier en cas de coupure, de cyclone, de blocus ou de maintenance. Aucun délai de rétablissement n'est garanti.

9. Responsabilité
Dans les limites permises par la loi, PDC DESIGN n'est pas responsable des dommages indirects, notamment perte de chance, de chiffre d'affaires ou préjudice commercial, liés à l'usage ou à l'impossibilité d'utiliser le Site, ni des actes des utilisateurs, des produits ou des rendez-vous pris via l'entraide.
Cette limite ne joue pas en cas de dol, de faute lourde, de dommage corporel, ni lorsqu'une responsabilité est déclarée non écartable. Le consommateur conserve les droits impératifs prévus par la loi de son pays de résidence dans l'Union européenne.

10. Garantie sur les contenus
La personne qui publie garantit qu'elle a le droit de le faire. Elle garantit PDC DESIGN contre une réclamation d'un tiers causée par son contenu, dans la mesure de sa faute.

11. Fin du service
L'usage peut cesser à tout moment. La suppression du compte se demande à l'Éditeur. PDC DESIGN peut arrêter le service en le signalant sur le Site lorsque c'est raisonnablement possible.

12. Litiges
Droit français. Entre professionnels, sous réserve de l'ordre public, les tribunaux de Pointe-à-Pitre sont compétents. Un consommateur saisit la juridiction que la loi lui ouvre, y compris celle de son domicile lorsque ce droit est impératif.
Une réclamation est d'abord adressée à PDC DESIGN. Le litige d'achat d'un produit se règle avec le commerce, PDC DESIGN n'étant pas le vendeur.

13. Évolution
Les conditions peuvent être modifiées. Continuer à publier après la mise en ligne de la nouvelle version vaut acceptation pour l'avenir. Si une clause est invalide, les autres restent. Ne pas s'en prévaloir une fois n'est pas y renoncer.
$lokali$)
on conflict (slug) do update
  set title = excluded.title,
      body = excluded.body,
      updated_at = now();
