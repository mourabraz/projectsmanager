import { object as DotObject } from 'dot-object';

interface TableObject {
  table: string;
  virtual?: IVirtualAttribute;
  select?: string;
  as?: string;
  localKey?: string;
  targetKey?: string;
  includes?: TableObject[];
  where?: string;
}

interface IVirtualAttribute {
  field: string;
  execute: string;
}

class QueryAsObject {
  private schema: TableObject;
  private queryString: string;
  private _tempJoinBeforeTable: string;
  private whereParameters: {};
  private queryParameters: any[];
  private parameters: string[];

  constructor(_schema: TableObject, _whereParameters: object) {
    this.schema = _schema;
    this._tempJoinBeforeTable = this.schema.as || this.schema.table;
    this.whereParameters = _whereParameters;
    this.queryParameters = [];
    this.parameters = [];

    this.init();
  }

  private init() {
    this.buildQueryString();
    this.buildQuerryParameters();
  }

  private getSelectFromIncludes(
    target: TableObject,
    select = '',
    currentAlias = '',
  ): string {
    if (!target.includes || (target.includes && target.includes.length === 0)) {
      return select;
    }

    currentAlias = currentAlias.replace('"', '').replace('"', '');

    let finalSelect = '';

    target.includes.forEach((i) => {
      const nestSelect = i.select
        .split(',')
        .map(
          (c) =>
            `${i.as || i.table}.${c.trim()} as "${
              currentAlias ? `${currentAlias}.` : ''
            }${i.as || i.table}.${c.trim()}"`,
        )
        .join(',');

      finalSelect += this.getSelectFromIncludes(
        i,
        `${select},${nestSelect}`,
        `"${
          this.schema.table === target.table
            ? ''
            : target.as || target.table + '.'
        }${i.as || i.table}"`,
      );
    });

    return finalSelect;
  }

  private buildSelectParent(): string {
    let c = this.schema.select
      .split(',')
      .map((c) => `${this.schema.as || this.schema.table}.${c.trim()}`)
      .join(',');

    if (this.schema.includes.length > 0) {
      c += this.getSelectFromIncludes(this.schema);
    }

    return c;
  }

  private getWhereChain(includes: TableObject[], where: string): string {
    if (!includes || (includes && includes.length === 0)) {
      return where;
    }

    includes.forEach((i) => {
      const nestIncludes: TableObject[] = i.includes;
      let nestWhere = i.where
        ? i.where
            .split(',')
            .map((c) => `${i.as || i.table}.${c.trim()}`)
            .join(',')
        : '';

      if (nestWhere) {
        const [, parameter] = nestWhere.match(/:(\w*)/);
        this.parameters.push(parameter);
        nestWhere = nestWhere.replace(':' + parameter, '$1');
      }

      if (!where) {
        where += this.getWhereChain(
          nestIncludes,
          `${nestWhere ? ` ${nestWhere}` : ''}`,
        );
      } else {
        where += this.getWhereChain(
          nestIncludes,
          `${nestWhere ? ` AND ${nestWhere}` : ''}`,
        );
      }
    });

    return where;
  }

  private buildWhereParent(): string {
    let c = this.schema.where
      ? this.schema.where
          .split(',')
          .map((c) => `${this.schema.as || this.schema.table}.${c.trim()}`)
          .join(',')
      : '';

    if (c) {
      const [, parameter] = c.match(/:(\w*)/);
      this.parameters.push(parameter);
      c = c.replace(':' + parameter, '$1');
    }

    if (this.schema.includes.length > 0) {
      c = this.getWhereChain(this.schema.includes, c);
    }

    return c ? ' WHERE ' + c : '';
  }

  private addSelectedFields(table: TableObject): string {
    const as = table.as || table.table;
    let select = table.select.split(',').map((s) => s.trim());

    if (table.virtual) {
      select = select.filter((s) => table.virtual.field !== s);
    }

    let query = '';

    query += select.map((c) => `${as}.${c.trim()}`).join(',');

    return query;
  }

  private addVirtualFields(table: TableObject): string {
    let query = '';

    if (table.virtual) {
      console.log('HAS VIRTUAL FIELD');
      query += ',';
      query += table.virtual.execute;
      query += ' AS ';
      query += table.virtual.field;
    }

    return query;
  }

  private buildJoins(includes: TableObject[]): string {
    let join = '';

    includes.forEach((i) => {
      join += ' LEFT JOIN (';

      join += 'SELECT ';
      join += this.addSelectedFields(i);

      console.log(this.addSelectedFields(i));

      join += this.addVirtualFields(i);

      join += ' FROM ';
      join += i.as ? `${i.table} as ${i.as}` : i.table;

      join += ` ) AS ${i.as || i.table} ON `;

      join += `${this._tempJoinBeforeTable}.${i.targetKey}`;

      join += '=';
      join += `${i.as || i.table}.${i.localKey} `;

      if (i.includes && i.includes.length > 0) {
        this._tempJoinBeforeTable = i.as || i.table;
        join += this.buildJoins(i.includes);
      }

      this._tempJoinBeforeTable = this.schema.as || this.schema.table;
    }, this);

    return join;
  }

  private buildQueryString() {
    let q = 'SELECT ';
    q += this.buildSelectParent();
    q += ' FROM ';
    q += this.schema.as
      ? `${this.schema.table} as ${this.schema.as}`
      : this.schema.table;

    if (this.schema.includes && this.schema.includes.length > 0) {
      q += this.buildJoins(this.schema.includes);
    }

    q += this.buildWhereParent();

    console.log(q);
    this.queryString = q;
  }

  private buildQuerryParameters() {
    this.parameters.forEach((p) => {
      this.queryParameters.push(this.whereParameters[p]);
    });
  }

  public getQuery(): [string, any[]] {
    return [this.queryString, this.queryParameters];
  }
}

const toCamel = (s: string) => {
  return s.replace(/([_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace('_', '');
  });
};

const concatResultOfManyToMany = (
  dataArray: any[],
  fields: { field: string; through: string } = { field: '', through: '' },
) => {
  const uniques = dataArray.filter(
    (s1, pos, arr) => arr.findIndex((s2) => s2.id === s1.id) === pos,
  );

  const diff = dataArray.filter(
    (s1, pos, arr) => arr.findIndex((s2) => s2.id === s1.id) !== pos,
  );

  const newList = uniques.map((i) => {
    const temp = {
      ...i,
      [fields.field]: i[fields.through][fields.field]
        ? [i[fields.through][fields.field]]
        : [],
    };

    delete temp[fields.through];

    return temp;
  });

  newList.forEach((i) => {
    const index = diff.findIndex((d) => d.id === i.id);

    if (index !== -1) {
      const indexField = i[fields.field]
        ? i[fields.field].findIndex(
            (p) => p.id === diff[index][fields.through][fields.field].id,
          )
        : -1;

      if (indexField === -1) {
        i[fields.field].push(diff[index][fields.through][fields.field]);
      }
    }
  });

  return newList;
};

const concatResultOfOneToMany = (
  dataArray: any[],
  fields: { field: string; through?: string } = { field: '', through: '' },
) => {
  const uniques = dataArray.filter(
    (s1, pos, arr) => arr.findIndex((s2) => s2.id === s1.id) === pos,
  );

  const diff = dataArray.filter(
    (s1, pos, arr) => arr.findIndex((s2) => s2.id === s1.id) !== pos,
  );

  const newList = uniques.map((i) => {
    const temp = {
      ...i,
      [fields.field]: i[fields.field] ? [i[fields.field]] : [],
    };

    //delete temp.users_projects;

    return temp;
  });

  newList.forEach((i) => {
    const index = diff.findIndex((d) => d.id === i.id);

    if (index !== -1) {
      const indexField = i[fields.field]
        ? i[fields.field].findIndex(
            (p) => p.id === diff[index][fields.field].id,
          )
        : -1;

      if (indexField === -1) {
        i[fields.field].push(diff[index][fields.field]);
      }
    }
  });

  return newList;
};

const removeNullObjects = (obj: {}) => {
  Object.keys(obj).forEach((key) => {
    const keyCamel = toCamel(key);

    obj[keyCamel] = obj[key];

    if (key !== keyCamel) {
      delete obj[key];
    }

    if (
      !['string', 'number', 'boolean', 'symbol', 'function'].includes(
        typeof obj[keyCamel],
      ) &&
      !(obj[keyCamel] instanceof Date) && //Object.prototype.toString.call(obj[keyCamel]) === '[object Date]'
      obj[keyCamel] != null
    ) {
      const isAllValuesNullOrUndefined = Object.values(obj[keyCamel]).every(
        (v) => v == null,
      );

      if (isAllValuesNullOrUndefined) {
        obj[keyCamel] = null;
      } else {
        obj[keyCamel] = removeNullObjects(obj[keyCamel]);
      }
    }
  });

  return obj;
};

const transformFlatToNest = (data): any[] => {
  const newArr = [];

  for (const each of data) {
    let newObj = DotObject(each);

    newObj = removeNullObjects(newObj);

    newArr.push(newObj);
  }

  return newArr;
};

export {
  QueryAsObject,
  transformFlatToNest,
  concatResultOfManyToMany,
  concatResultOfOneToMany,
};

// private concatParticipantsOfProject(dataArray: any[]) {
//   const uniques = dataArray.filter(
//     (s1, pos, arr) => arr.findIndex((s2) => s2.id === s1.id) === pos,
//   );

//   const diff = dataArray.filter(
//     (s1, pos, arr) => arr.findIndex((s2) => s2.id === s1.id) !== pos,
//   );

//   const newList = uniques.map((i) => {
//     const temp = {
//       ...i,
//       participants: [i.usersProjects.participants],
//     };

//     delete temp.usersProjects;

//     return temp;
//   });

//   newList.forEach((i) => {
//     const index = diff.findIndex((d) => d.id === i.id);

//     if (index !== -1) {
//       const indexParticipant = i.participants.findIndex(
//         (p) => p.id === diff[index].usersProjects.participants.id,
//       );

//       if (indexParticipant === -1) {
//         i.participants.push(diff[index].usersProjects.participants);
//       }
//     }
//   });

//   return newList;
// }
