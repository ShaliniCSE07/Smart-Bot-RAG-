from langchain_community.embeddings import HuggingFaceEmbeddings

# Initialize the embedding model lazily so it's loaded only when needed
embeddings_model = None

def get_embeddings_model():
    global embeddings_model
    if embeddings_model is None:
        embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return embeddings_model

