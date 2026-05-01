# You can use most Debian-based base images
FROM oven/bun:latest

# Install curl and git
RUN apt-get update && apt-get install -y curl git && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user

RUN bunx --bun shadcn@latest init --yes --preset b0 --template next --name nextjs-app
RUN bunx --bun shadcn@latest add --all --yes -c /home/user/nextjs-app
