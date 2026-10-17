import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from 'vite';
let server, Moderation;
before(async () => {
  server = await createServer({ server: { middlewareMode:true, hmr:false }, appType:'custom' });
  Moderation = (await server.ssrLoadModule('/src/pages/Moderation.tsx')).default;
});
after(async () => { await server?.close(); });
const filters = { q:'', status:'', reporter:'', reportedUser:'', from:'', to:'', sort:'date', direction:'desc' };
function render(reports) {
  const client = new QueryClient({ defaultOptions:{ queries:{ retry:false, staleTime:Infinity, gcTime:0 } } });
  client.setQueryData(['moderation','reports',filters,1],reports);
  client.setQueryData(['moderation','restrictions'],[]);
  client.setQueryData(['moderation','jobs'],[]);
  const html=renderToStaticMarkup(React.createElement(QueryClientProvider,{client},React.createElement(Moderation)));
  client.clear(); return html;
}
test('reported chats shows separate reporter and subject identities, evidence, explanation and status without executing message HTML',()=>{
  const html=render([{id:'report-fixture',status:'PENDING',createdAt:'2026-10-13T00:00:00Z',chatId:'chat-fixture',reason:'SCAM',explanation:'Synthetic invoice concern',reporter:{id:11,userType:'CUSTOMER',name:'Reporter Fixture',email:'reporter@fixture.test'},reportedUser:{id:22,userType:'EMPLOYEE',name:'Subject Fixture',email:'subject@fixture.test'},evidence:{content:'<script>alert("fixture")</script>',createdAt:'2026-10-12T23:59:00Z'},hasAttachmentEvidence:false}]);
  assert.match(html,/Reported Chats/); assert.match(html,/Reporter:.*Reporter Fixture/s); assert.match(html,/Reported user:.*Subject Fixture/s);
  assert.match(html,/CUSTOMER:11/); assert.match(html,/EMPLOYEE:22/); assert.match(html,/Synthetic invoice concern/); assert.match(html,/Pending/); assert.match(html,/chat-fixture/);
  assert.match(html,/&lt;script&gt;/); assert.ok(!html.includes('<script>'));
});
test('an empty queue is explicit and offers filtering, pagination and separate restriction and job sections',()=>{
  const html=render([]); assert.match(html,/No reports match these filters/); assert.match(html,/Apply filters/); assert.match(html,/Previous/); assert.match(html,/Active restrictions/); assert.match(html,/Message removal jobs/);
});
