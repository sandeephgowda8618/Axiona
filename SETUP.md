# Axiona Setup Guide

## Environment Variables

This project uses environment variables for API keys and sensitive configuration. Create the appropriate `.env` files in the relevant directories and add the following variables:

### For StudyPES_material_retrival and META_dataretreval_libreary_refrences:

```env
PERPLEXITY_API_KEY=your_perplexity_api_key_here
PERPLEXITY_MODEL=pplx-70b-online
GOOGLE_API_KEY=your_google_api_key_here
```

### For server (Node.js backend):

```env
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

## Getting API Keys

1. **Perplexity API Key**: Sign up at [Perplexity](https://perplexity.ai) and obtain your API key
2. **Google API Key**: Create a project in [Google Cloud Console](https://console.cloud.google.com) and enable the required APIs

## Installation & Running

Refer to the main README.md files in each component directory for specific installation and running instructions.

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- The Firebase configuration in the client is public and safe to expose
