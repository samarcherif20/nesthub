-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
