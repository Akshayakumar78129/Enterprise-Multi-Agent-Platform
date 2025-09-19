"""Base schema classes for database table definitions"""

from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class TableSchema:
    """Base class for table schemas"""
    table_name: str
    alias: str
    columns: Dict[str, str]
    refs: Dict[str, str]
    output_aliases: Dict[str, str]

    def get_column_ref(self, column_name: str) -> str:
        """Get the full column reference with alias"""
        return self.refs.get(column_name, '')

    def get_output_alias(self, column_name: str) -> str:
        """Get the output alias for a column"""
        return self.output_aliases.get(column_name, column_name)

    def build_select_clause(self, fields: list) -> str:
        """Build SELECT clause for specified fields"""
        select_parts = []
        for field in fields:
            if field in self.refs and field in self.output_aliases:
                select_parts.append(
                    f"{self.refs[field]} AS {self.output_aliases[field]}"
                )
        return ",\n        ".join(select_parts)


class BaseSchema:
    """Base class for domain schemas"""

    @classmethod
    def get_tables(cls) -> Dict[str, str]:
        """Return table name mappings"""
        raise NotImplementedError

    @classmethod
    def get_aliases(cls) -> Dict[str, str]:
        """Return table alias mappings"""
        raise NotImplementedError