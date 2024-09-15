from openai import OpenAI
import random
import time
import os
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec
import datetime
from datetime import datetime

client = OpenAI()
pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))
index_name = "conversation-history"

if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1"),
    )
    print(f"Created new index: {index_name}")
else:
    print(f"Index {index_name} already exists")

index = pc.Index(index_name)


def get_filler_words():
    fillers = ["Let's see...", "You know,", "Hmmm...", "Well..."]
    return random.choice(fillers)


def get_ai_response(user_input, conversation_history):

    embeddings = OpenAIEmbeddings(openai_api_key=os.environ["OPENAI_API_KEY"])
    vector_store = PineconeVectorStore(
        index=index, embedding=embeddings, text_key="text"
    )

    retriever = vector_store.as_retriever(search_kwargs={"k": 5})

    llm = ChatOpenAI(
        openai_api_key=os.environ.get("OPENAI_API_KEY"),
        model_name="gpt-4o-mini",
        temperature=0.0,
    )

    qa = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)
    conversation_context = "\n".join(conversation_history)

    if "last meeting" in user_input.lower():
        # Query for the most recent meeting
        query_response = index.query(
            vector=[0] * 1536,  # Dummy vector
            top_k=1,
            include_metadata=True,
            filter={"meeting_number": {"$exists": True}},
            sort={"meeting_date": -1}
        )
        if query_response['matches']:
            last_meeting = query_response['matches'][0]
            full_query = f"In the last meeting (number {last_meeting['metadata']['meeting_number']} on {last_meeting['metadata']['meeting_date']}), the following was discussed:\n\n{last_meeting['metadata']['text']}\n\nBased on this, {user_input}"
        else:
            full_query = f"I'm sorry, I don't have any information about previous meetings. Regarding your current question: {user_input}"
    else:
        full_query = f"Conversation history:\n{conversation_context}\n\nUser's latest input: {user_input}\n\nProvide a concise response based on this context."

    response = qa({"query": full_query})
    ai_response = response["result"]

    # filler = get_filler_words()
    # ai_response_with_filler = f"{filler} {ai_response}"

    # return ai_response_with_filler

    return ai_response


def save_conversation_context():
    pass


def create_conversation_embedding(conversation_id, conversation_text, meeting_number):
    embeddings = OpenAIEmbeddings(openai_api_key=os.environ["OPENAI_API_KEY"])
    vector_store = PineconeVectorStore(
        index=index, embedding=embeddings, text_key="text"
    )

    meeting_date = datetime.now().strftime("%Y-%m-%d")
    meeting_time = datetime.now().strftime("%H:%M:%S")

    try:
        vector_store.add_texts(
            texts=[conversation_text],
            metadatas=[{
                "conversation_id": conversation_id,
                "meeting_number": meeting_number,
                "meeting_date": meeting_date,
                "meeting_time": meeting_time
            }],
            ids=[f"{conversation_id}_full_{int(time.time())}"],
        )
        print(f"Saved full conversation embedding to Pinecone: {conversation_id}")
    except Exception as e:
        print(f"Error saving full conversation embedding to Pinecone: {e}")


def get_next_meeting_number():
    try:
        query_response = index.query(
            vector=[0] * 1536,
            top_k=1,
            include_metadata=True,
            filter={"meeting_number": {"$exists": True}}
        )
        if query_response['matches']:
            highest_meeting_number = max(int(match['metadata']['meeting_number']) for match in query_response['matches'])
            return highest_meeting_number + 1
        else:
            return 1
    except Exception as e:
        print(f"Error getting next meeting number: {e}")
        return 1


