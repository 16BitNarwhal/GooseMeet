# script to delete all vectors from pinecone! caution....

import os
from pinecone import Pinecone
import dotenv

dotenv.load_dotenv()

pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
index_name = "conversation-history"
index = pc.Index(index_name)
index.delete(delete_all=True)
print(f"All vectors in the '{index_name}' index have been deleted.")
