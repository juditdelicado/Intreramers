# Intreramers
Network colaborativa entre alumnes i alumni ERAM

## Traducció català / anglès

La interfície utilitza català per defecte i permet seleccionar anglès des de **Configuració**. La preferència es desa al perfil de Firestore i al navegador. El contingut redactat pels usuaris es tradueix a l'idioma seleccionat i ofereix el control **«Veure l'original» / «See original»** quan la llengua detectada és diferent.

Les traduccions s'executen a la callable Cloud Function `translateUserContent` a `europe-west1`; el navegador no conté cap credencial de Google Cloud Translation. Els textos que es tradueixen s'envien a Google Cloud Translation. Per desplegar la funció al projecte Firebase `intreramers`:

1. Activa Cloud Functions i l'API Cloud Translation v3 al projecte de Google Cloud.
2. Concedeix al compte de servei d'execució de les Cloud Functions el rol `Cloud Translation API User` (`roles/cloudtranslate.user`).
3. Instal·la Firebase CLI i executa `firebase deploy --only functions:translateUserContent --project intreramers` des de l'arrel del repositori.

La funció només accepta usuaris autenticats, idiomes `ca`/`en` i lots limitats; els textos no s'escriuen als logs de la funció. Les traduccions reals requereixen desplegar la funció i tenir habilitada l'API de Google Cloud Translation.
