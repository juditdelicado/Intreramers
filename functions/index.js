const { TranslationServiceClient } = require("@google-cloud/translate").v3;
const { onCall, HttpsError } = require("firebase-functions/v2/https");

let translationClient;
const maxItems = 50;
const maxCodepoints = 23000;

exports.translateUserContent = onCall(
  {
    region: "europe-west1",
    maxInstances: 5
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in to use translation.");
    }

    const { contents, targetLanguage } = request.data || {};
    if (targetLanguage !== "ca" && targetLanguage !== "en") {
      throw new HttpsError("invalid-argument", "Only Catalan and English are supported.");
    }
    if (!Array.isArray(contents) || contents.length === 0 || contents.length > maxItems) {
      throw new HttpsError("invalid-argument", "The translation batch size is invalid.");
    }

    const totalCodepoints = contents.reduce((total, content) => {
      if (typeof content !== "string" || !content.trim()) {
        throw new HttpsError("invalid-argument", "Every translation item must be non-empty text.");
      }
      return total + Array.from(content).length;
    }, 0);
    if (totalCodepoints > maxCodepoints) {
      throw new HttpsError("invalid-argument", "The translation request is too large.");
    }

    try {
      translationClient ||= new TranslationServiceClient();
      const [response] = await translationClient.translateText({
        parent: `projects/${process.env.GCLOUD_PROJECT}/locations/global`,
        contents,
        mimeType: "text/plain",
        targetLanguageCode: targetLanguage
      });

      return {
        translations: (response.translations || []).map((translation) => ({
          text: translation.translatedText || "",
          detectedLanguage: translation.detectedLanguageCode || ""
        }))
      };
    } catch (error) {
      console.error("Google Cloud Translation request failed.", {
        code: error.code || "unknown"
      });
      throw new HttpsError("unavailable", "Translation is temporarily unavailable.");
    }
  }
);
