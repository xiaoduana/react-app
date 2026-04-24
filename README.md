This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



1.无常损失对于稳定币是不是很难体现出来
2.poolManager对于开发者是不是相对来说没有positionManger更重要，因为配置流动性都是在position
3.在配置完流动性时，传参不是页面所有字段都传递过去，还有参数index是指定池吗，不理解这个参数作用
4.position列表展示页面，如果全量查询或者调用position abi返回的都是地址,那么怎么去展示symbol，以及数量
5.position列表页面怎么拿到current price,current price是不是预言机合约提供的，或者预言机本身不是合约，是其他的
6.展示问题，配置的流动性区间合约没返回，要怎么拿到自己配置的正确的数据，不止流动性区间，或者说是根据其他字段进行计算所得？
8.swap合约参数都啥意思，前端怎么拿到exactInput,exactOutput,是不是目前做的示例是自己转自己ERC20代币
9.swap转账调用哪个合约方法
