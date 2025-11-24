Usage and example: Extending the BaseRepository

1) Create a repository for your domain by extending `BaseRepository`.

Example (pseudo-code):

```ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from './base.repository';

// Replace `MyDoc` with your Document type (usually <Name>Document)
@Injectable()
export class MyDomainRepository extends BaseRepository<MyDoc> {
  constructor(@InjectModel('MyModel') model: Model<MyDoc>) {
    super(model);
  }
}
```

2) Register the repository in your domain module's `providers` and `exports`:

```ts
@Module({
  imports: [MongooseModule.forFeature([{ name: 'MyModel', schema: MySchema }])],
  providers: [MyDomainRepository],
  exports: [MyDomainRepository],
})
export class MyDomainModule {}
```

3) Use the repository in services by injecting it as usual.

Notes:
- The `BaseRepository` is intentionally minimal — you can add paging, soft-delete, transactions, or per-model helpers.
- If you need typings where `T` is the raw interface (not Document), you can wrap types: e.g. `BaseRepository<MyDocumentType & Document>`.
