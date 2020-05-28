import { object as DotObject } from 'dot-object';

interface TableObject {
  table: string;
  select?: string;
  as?: string;
  localKey?: string;
  targetKey?: string;
  includes?: TableObject[];
  where?: string;
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
    //includes: TableObject[],
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
        console.log('NEST have WHERE');
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
      console.log(parameter);
      c = c.replace(':' + parameter, '$1');
      console.log('NEW C', c);
    }

    if (this.schema.includes.length > 0) {
      c = this.getWhereChain(this.schema.includes, c);
    }

    return c ? ' WHERE ' + c : '';
  }

  private buildJoins(includes: TableObject[]): string {
    let join = '';

    includes.forEach((i) => {
      join += ' JOIN (';

      join += 'SELECT ';
      join += i.select
        .split(',')
        .map((c) => `${i.as || i.table}.${c.trim()}`)
        .join(',');
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

    this.queryString = q;
  }

  private buildQuerryParameters() {
    this.parameters.forEach((p) => {
      this.queryParameters.push(this.whereParameters[p]);
    });
  }

  public getQuery(): [string, any[]] {
    console.log(this);
    return [this.queryString, this.queryParameters];
  }
}

const transformFlatToNest = (data): any[] => {
  const newArr = [];

  for (const each of data) {
    const newObj = DotObject(each);
    newArr.push(newObj);
  }

  return newArr;
};

export { QueryAsObject, transformFlatToNest };
