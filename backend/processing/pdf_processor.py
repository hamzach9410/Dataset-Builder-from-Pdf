import os
import json
import re
from PyPDF2 import PdfReader
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize, sent_tokenize

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class PDFProcessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
    
    def process_pdfs(self, pdf_paths, output_path):
        merged_text = self.extract_text(pdf_paths)
        cleaned_text = self.clean_text(merged_text)
        sentences = self.split_sentences(cleaned_text)
        unique_sentences = self.remove_duplicates(sentences)
        
        dataset = [{"text": sentence} for sentence in unique_sentences]
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(dataset, f, ensure_ascii=False, indent=4)
        
        return dataset
    
    def process_pdfs_to_txt(self, pdf_paths, output_path):
        """Convert PDFs to plain text format"""
        merged_text = self.extract_text(pdf_paths)
        cleaned_text = self.clean_text_basic(merged_text)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(cleaned_text)
        
        return {"text": cleaned_text}
    
    def process_pdfs_to_ton(self, pdf_paths, output_path):
        """Convert PDFs to Token-Oriented Notation format"""
        merged_text = self.extract_text(pdf_paths)
        ton_data = self.create_ton_format(merged_text)
        
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(ton_data, f, ensure_ascii=False, indent=2)
        
        return ton_data
    
    def create_ton_format(self, text):
        """Create Token-Oriented Notation format"""
        sentences = sent_tokenize(text)
        ton_data = {
            "metadata": {
                "format": "TON",
                "version": "1.0",
                "total_sentences": len(sentences),
                "created_at": "auto-generated"
            },
            "tokens": []
        }
        
        for i, sentence in enumerate(sentences):
            if len(sentence.strip()) > 10:
                tokens = word_tokenize(sentence.lower())
                cleaned_tokens = [token for token in tokens if token.isalnum() and token not in self.stop_words]
                
                if cleaned_tokens:
                    ton_data["tokens"].append({
                        "id": i + 1,
                        "sentence": sentence.strip(),
                        "tokens": cleaned_tokens,
                        "token_count": len(cleaned_tokens),
                        "pos_tags": self.get_pos_tags(cleaned_tokens)
                    })
        
        return ton_data
    
    def get_pos_tags(self, tokens):
        """Simple POS tagging simulation"""
        pos_map = {
            "noun": ["data", "system", "user", "file", "text"],
            "verb": ["process", "create", "generate", "extract", "convert"],
            "adj": ["new", "large", "small", "good", "bad"]
        }
        
        tags = []
        for token in tokens:
            tag = "noun"  # default
            for pos, words in pos_map.items():
                if token in words:
                    tag = pos
                    break
            tags.append({"token": token, "pos": tag})
        
        return tags
    
    def clean_text_basic(self, text):
        """Basic text cleaning for TXT format"""
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'http[s]?://\S+', '', text)
        return text.strip()
    
    def extract_text(self, pdf_paths):
        text = ""
        for path in pdf_paths:
            if os.path.exists(path):
                with open(path, "rb") as file:
                    reader = PdfReader(file)
                    for page in reader.pages:
                        text += page.extract_text() + " "
        return text
    
    def clean_text(self, text):
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'http[s]?://\S+', '', text)
        text = re.sub(r'[^a-zA-Z0-9\s\.\?\!]', '', text)
        
        words = text.lower().split()
        words = [word for word in words if word not in self.stop_words]
        return ' '.join(words)
    
    def split_sentences(self, text):
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 10]
    
    def remove_duplicates(self, sentences):
        seen = set()
        unique = []
        for sentence in sentences:
            if sentence.lower() not in seen:
                seen.add(sentence.lower())
                unique.append(sentence)
        return unique