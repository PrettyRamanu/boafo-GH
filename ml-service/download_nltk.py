"""Run this once after pip install to download NLTK data needed by TextBlob."""
import nltk
nltk.download('punkt')
nltk.download('punkt_tab')
nltk.download('averaged_perceptron_tagger')
nltk.download('averaged_perceptron_tagger_eng')
print("NLTK data downloaded successfully.")
